#!/usr/bin/env python3
"""Validate current public-page observations and cache their original photos.

The input is an array, or {"rows": [...]}, captured separately from visible Shopee
pages. This script never scrapes a product page, infers a missing fact, translates
a listing title, rounds a price, or signs in to a service. Use --require-count
1500 for the final import; smaller imports are allowed for local development.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import sys
from threading import Event
from typing import Any
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


ROOT = Path(__file__).resolve().parents[1]
IMAGE_HOSTS = {"down-th.img.susercontent.com", "down-sg.img.susercontent.com"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
PRICE_PATTERN = re.compile(
    r"^\s*(?:฿|THB)?\s*"
    r"(?P<amount>(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.0+)?)"
    r"\s*(?:บาท|THB)?\s*$",
    re.IGNORECASE,
)
SOURCE_LABEL = {
    "en": "Observed Shopee listing price; variant and eligibility terms apply.",
    "th": "ราคาที่เห็นในรายการ Shopee ขึ้นกับตัวเลือกสินค้าและเงื่อนไขสิทธิ์",
}
DEMO_EXCLUSIONS = re.compile(
    r"บุหรี่|ยาสูบ|ดิลโด้|เซ็กส์?ทอย|อวัยวะเพศเทียม|กัญชา|กระสุน|ปืนจริง"
    r"|\b(?:vapes?|cigarettes?|tobacco|sex\s*toys?|dildos?|cannabis|marijuana|cocaine|heroin|methamphetamine)\b",
    re.IGNORECASE,
)


class InvalidObservation(ValueError):
    pass


class DownloadBlocked(RuntimeError):
    pass


def exact_baht(value: Any) -> int:
    if not isinstance(value, str):
        raise InvalidObservation("priceText must be the exact visible text")
    match = PRICE_PATTERN.fullmatch(value)
    if not match:
        raise InvalidObservation("priceText is not one exact whole-baht amount")
    amount = Decimal(match.group("amount").replace(",", ""))
    if amount <= 0 or amount > 9_007_199_254_740_991:
        raise InvalidObservation("price is outside positive safe integer baht")
    return int(amount)


def price_evidence(price_text: str, card_text: str) -> str | None:
    """Check captured text without deriving a price from flattened card content.

    Some Shopee cards concatenate a separately captured price element with the
    next rating/location element. That shape is an acknowledged ambiguity, not
    independent price proof; the isolated price element remains authoritative.
    """
    price = re.sub(r"\s+", "", price_text)
    card = re.sub(r"\s+", "", card_text)
    ambiguous = False
    for match in re.finditer(re.escape(price), card):
        if price[0].isdigit() and match.start() and card[match.start() - 1] in "0123456789.,":
            continue
        suffix = card[match.end():]
        if not suffix or suffix[0] not in "0123456789.,":
            return "token-boundary"
        # Observed cards use a one-decimal rating followed by a rating/location
        # field. Never treat arbitrary trailing digits or a decimal as a price.
        if re.match(r"(?:[0-4]\.[0-9]|5\.0)(?=(?:คะแนน)?(?:จังหวัด|ต่างประเทศ|อินโดนีเซีย|มาเลเซีย))", suffix):
            ambiguous = True
    return "flattened-rating-suffix" if ambiguous else None


def safe_url(value: Any, hosts: set[str]) -> str:
    if not isinstance(value, str) or not value or len(value) > 8192:
        raise InvalidObservation("missing or oversized source URL")
    if any(ord(char) < 32 for char in value):
        raise InvalidObservation("source URL contains control characters")
    try:
        parsed = urlparse(value)
        valid = (
            parsed.scheme == "https"
            and parsed.hostname in hosts
            and parsed.username is None
            and parsed.password is None
            and parsed.port is None
            and not parsed.fragment
        )
    except ValueError as error:
        raise InvalidObservation("malformed source URL") from error
    if not valid:
        raise InvalidObservation("source URL is outside its HTTPS allowlist")
    return value


def source_url(value: Any, shop_id: str, item_id: str) -> str:
    value = safe_url(value, {"shopee.co.th"})
    path = unquote(urlparse(value).path).rstrip("/")
    slug_pattern = rf"/[^/]+-i\.{re.escape(shop_id)}\.{re.escape(item_id)}"
    if path != f"/product/{shop_id}/{item_id}" and not re.fullmatch(slug_pattern, path):
        raise InvalidObservation("product URL does not identify this shop/item")
    return value


def image_url(value: Any) -> str | None:
    if value is None or value == "":
        return None
    value = safe_url(value, IMAGE_HOSTS)
    if not re.fullmatch(r"/file/[A-Za-z0-9._~-]+", urlparse(value).path):
        raise InvalidObservation("image URL is not an observed CDN file")
    return value


def observation_time(value: Any, now: datetime, max_age_hours: int) -> datetime:
    if not isinstance(value, str):
        raise InvalidObservation("observedAt must contain an ISO timestamp")
    try:
        stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise InvalidObservation("invalid observedAt") from error
    if stamp.tzinfo is None:
        raise InvalidObservation("observedAt needs an explicit timezone")
    stamp = stamp.astimezone(timezone.utc)
    if stamp > now + timedelta(minutes=5):
        raise InvalidObservation("observedAt is in the future")
    if now - stamp > timedelta(hours=max_age_hours):
        raise InvalidObservation("observation is older than the freshness limit")
    return stamp


def text(value: Any, field: str, maximum: int) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise InvalidObservation(f"invalid {field}")
    if "\x00" in value:
        raise InvalidObservation(f"NUL character in {field}")
    return value


def validate_row(
    raw: Any, now: datetime, max_age_hours: int
) -> tuple[dict[str, Any], dict[str, Any], datetime]:
    if not isinstance(raw, dict):
        raise InvalidObservation("row must be an object")
    shop_id, item_id = raw.get("shopId"), raw.get("itemId")
    if any(
        not isinstance(value, str) or not re.fullmatch(r"[1-9][0-9]{0,19}", value)
        for value in (shop_id, item_id)
    ):
        raise InvalidObservation("shopId and itemId must be decimal strings")
    identity = f"{shop_id}.{item_id}"
    if raw.get("id") != identity:
        raise InvalidObservation("id differs from shopId.itemId")
    category = raw.get("category")
    category_id = category.get("id") if isinstance(category, dict) else None
    if (
        not isinstance(category_id, str)
        or not 1 <= len(category_id) <= 2048
        or not re.fullmatch(r"(?:[A-Za-z0-9_.~-]|%[0-9A-Fa-f]{2})+", category_id)
    ):
        raise InvalidObservation("invalid category")
    localized = category.get("name")
    if not isinstance(localized, dict):
        raise InvalidObservation("category needs Thai and English labels")
    group_names = {lang: text(localized.get(lang), f"category.{lang}", 160) for lang in ("en", "th")}
    category = {
        # These are source query groups, not claims about official taxonomy.
        "id": "q-" + hashlib.sha256(group_names["th"].encode("utf-8")).hexdigest()[:12],
        "name": group_names,
    }
    title = text(raw.get("name"), "listing name", 2000)
    scope_text = unicodedata.normalize("NFKC", "\n".join((title, *group_names.values())))
    if DEMO_EXCLUSIONS.search(scope_text):
        raise InvalidObservation("outside general-shopping demo scope")
    stamp = observation_time(raw.get("observedAt"), now, max_age_hours)
    source = source_url(raw.get("source"), shop_id, item_id)
    card_text = raw.get("cardText")
    if not isinstance(card_text, str) or len(card_text) > 20000:
        raise InvalidObservation("cardText must retain the observed card text")
    price = exact_baht(raw.get("priceText"))
    if not price_evidence(raw["priceText"], card_text):
        raise InvalidObservation("priceText is absent or truncates an observed numeric token")
    return (
        {
            "id": identity,
            # Preserve the original listing title in both interface languages.
            "name": {"en": title, "th": title},
            "category": category["id"],
            "price": price,
            "currency": "THB",
            "image": None,
            "source": source,
            "size": None,
            "sellerName": None,
            "observedAt": stamp.isoformat().replace("+00:00", "Z"),
            "collectedAt": now.isoformat().replace("+00:00", "Z"),
            "priceSource": safe_url(raw.get("priceSource"), {"shopee.co.th"}),
            "imageSource": image_url(raw.get("imageSource")),
            "sourceLabel": SOURCE_LABEL,
        },
        category,
        stamp,
    )


def select_rows(
    raw_rows: list[Any], now: datetime, max_age_hours: int, limit: int
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    candidates: dict[str, list[tuple[dict[str, Any], dict[str, Any], datetime, int]]] = defaultdict(list)
    rejected: list[dict[str, Any]] = []
    for index, raw in enumerate(raw_rows):
        try:
            item, category, stamp = validate_row(raw, now, max_age_hours)
            candidates[item["id"]].append((item, category, stamp, index))
        except InvalidObservation as error:
            rejected.append({"row": index, "reason": str(error)})
    selected: list[tuple[dict[str, Any], dict[str, Any], datetime, int]] = []
    duplicates = 0
    for identity in sorted(candidates):
        observations = candidates[identity]
        duplicates += len(observations) - 1
        latest = max(entry[2] for entry in observations)
        newest = [entry for entry in observations if entry[2] == latest]
        if len({entry[0]["price"] for entry in newest}) != 1:
            rejected.append({"id": identity, "reason": "conflicting prices at the same observation time"})
            continue
        # Input order is irrelevant when duplicate observations have equal times.
        selected.append(min(newest, key=lambda entry: json.dumps(entry[0], sort_keys=True, ensure_ascii=False)))
    category_names: dict[str, dict[str, str]] = {}
    buckets: dict[str, deque] = defaultdict(deque)
    for entry in selected:
        item, category, _, _ = entry
        previous = category_names.setdefault(category["id"], category["name"])
        if previous != category["name"]:
            raise InvalidObservation(f"conflicting labels for category {category['id']}")
        buckets[item["category"]].append(entry)
    # Round-robin categories and numeric-text IDs give reproducible broad coverage.
    chosen = []
    while buckets and len(chosen) < limit:
        for category_id in sorted(list(buckets)):
            chosen.append(buckets[category_id].popleft())
            if not buckets[category_id]:
                del buckets[category_id]
            if len(chosen) == limit:
                break
    counts = Counter(entry[0]["category"] for entry in chosen)
    categories = [
        {"id": category_id, "name": category_names[category_id], "count": counts[category_id]}
        for category_id in sorted(counts)
    ]
    audit = {
        "inputRows": len(raw_rows),
        "validUniqueRows": len(selected),
        "duplicateObservations": duplicates,
        "selectedRows": len(chosen),
        "selectedInputRows": [entry[3] for entry in chosen],
        "priceEvidence": dict(Counter(price_evidence(raw_rows[entry[3]]["priceText"], raw_rows[entry[3]]["cardText"]) for entry in chosen)),
        "rejected": rejected,
    }
    return [entry[0] for entry in chosen], categories, audit


class SafeImageRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        image_url(new_url)
        return super().redirect_request(request, response, code, message, headers, new_url)


def image_type(data: bytes) -> str | None:
    if len(data) > 4 and data.startswith(b"\xff\xd8\xff") and b"\xff\xd9" in data[-4096:]:
        return "image/jpeg"
    if len(data) >= 45 and data.startswith(b"\x89PNG\r\n\x1a\n") and data[-12:-4] == b"\x00\x00\x00\x00IEND":
        return "image/png"
    if len(data) >= 20 and data[:4] == b"RIFF" and data[8:12] == b"WEBP" and int.from_bytes(data[4:8], "little") + 8 == len(data):
        return "image/webp"
    return None


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def download_image(item: dict[str, Any], directory: Path, stopped: Event, timeout: int) -> dict[str, Any]:
    identity = item["id"]
    source = item["imageSource"]
    if not source:
        return {"id": identity, "error": "no image observed"}
    target = directory / f"{identity}.jpg"
    source_note = directory / f"{identity}.source"
    if target.is_symlink() or source_note.is_symlink():
        return {"id": identity, "error": "cached image is a symlink"}
    if (
        target.exists()
        and source_note.exists()
        and source_note.read_text(encoding="utf-8") == source
        and image_type(target.read_bytes())
    ):
        return {"id": identity, "cached": True}
    if stopped.is_set():
        return {"id": identity, "error": "download stopped"}
    try:
        request = Request(source, headers={"Accept": "image/jpeg,image/png,image/webp", "User-Agent": "DynamicShopper-Catalog-Preview/1.0"})
        with build_opener(SafeImageRedirect()).open(request, timeout=timeout) as response:
            image_url(response.url)
            content_type = response.headers.get_content_type()
            if content_type not in ("image/jpeg", "image/png", "image/webp", "application/octet-stream"):
                return {"id": identity, "error": f"original image is {content_type}; not converted"}
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_IMAGE_BYTES:
                return {"id": identity, "error": "image exceeds size limit"}
            data = response.read(MAX_IMAGE_BYTES + 1)
        detected_type = image_type(data)
        if len(data) > MAX_IMAGE_BYTES or not detected_type:
            return {"id": identity, "error": "response is not a bounded original JPEG, PNG or WebP"}
        if stopped.is_set():
            return {"id": identity, "error": "download stopped"}
        temporary = target.with_suffix(".jpg.tmp")
        temporary.write_bytes(data)
        temporary.replace(target)
        temporary_note = source_note.with_suffix(".source.tmp")
        temporary_note.write_text(source, encoding="utf-8")
        temporary_note.replace(source_note)
        return {"id": identity, "cached": True, "contentType": detected_type}
    except HTTPError as error:
        if error.code in (401, 403, 429) or (error.code == 503 and error.headers.get("Retry-After")):
            stopped.set()
            raise DownloadBlocked(f"Image host returned HTTP {error.code}; no retry or access workaround") from error
        return {"id": identity, "error": f"HTTP {error.code}"}
    except (URLError, TimeoutError, OSError, ValueError) as error:
        return {"id": identity, "error": str(error)[:300]}


def self_test() -> None:
    from tempfile import TemporaryDirectory
    import unittest
    from unittest.mock import patch

    class BoundaryTests(unittest.TestCase):
        def setUp(self):
            self.now = datetime(2026, 11, 21, 7, tzinfo=timezone.utc)
            self.row = {
                "id": "1.2", "shopId": "1", "itemId": "2", "name": "Source title",
                "source": "https://shopee.co.th/product/1/2?variant=source",
                "imageSource": "https://down-th.img.susercontent.com/file/test",
                "priceText": "฿1,290.00", "cardText": "Source title ฿1,290.00",
                "category": {"id": "phones", "name": {"en": "Phones", "th": "โทรศัพท์"}},
                "observedAt": "2026-11-21T06:30:00Z", "priceSource": "https://shopee.co.th/list/phones",
            }

        def test_exact_money(self):
            self.assertEqual(exact_baht("฿ 1,290.00"), 1290)
            for bad in ("฿1,290.50", "฿100–200", "from ฿100", "฿1k", "฿1,00", "0", 100):
                with self.assertRaises(InvalidObservation):
                    exact_baht(bad)

        def test_price_presence_rejects_numeric_truncation(self):
            for price_text, card_text in (
                ("฿1", "Source title ฿1,290"),
                ("฿1", "Source title ฿1290"),
                ("฿100", "Source title ฿100.50"),
                ("฿10", "Source title ฿104.80คะแนนจังหวัดนนทบุรี"),
                ("฿65", "Source title ฿654.8"),
            ):
                with self.assertRaises(InvalidObservation):
                    validate_row({**self.row, "priceText": price_text, "cardText": card_text}, self.now, 24)
            self.assertEqual(price_evidence("฿ 1,290", "Source title ฿ 1,290 จังหวัดนนทบุรี"), "token-boundary")
            self.assertEqual(price_evidence("฿65", "Source title ฿654.8จังหวัดนนทบุรี"), "flattened-rating-suffix")

        def test_trust_boundaries_and_freshness(self):
            for key, value in (
                ("source", "https://shopee.co.th/product/1/3"),
                ("imageSource", "https://down-th.img.susercontent.com.evil.test/file/a"),
                ("priceSource", "https://user:password@shopee.co.th/list/a"),
                ("observedAt", "2025-05-31T00:00:00Z"),
            ):
                with self.assertRaises(InvalidObservation):
                    validate_row({**self.row, key: value}, self.now, 24)

        def test_deduplication_and_conflicting_observations(self):
            items, _, audit = select_rows([self.row, self.row], self.now, 24, 1500)
            self.assertEqual(len(items), 1)
            self.assertEqual(audit["duplicateObservations"], 1)
            changed = {**self.row, "priceText": "฿1291", "cardText": "Source title ฿1291"}
            items, _, _ = select_rows([self.row, changed], self.now, 24, 1500)
            self.assertEqual(items, [])
            items, _, _ = select_rows([self.row, {**changed, "observedAt": "2026-11-21T06:31:00Z"}], self.now, 24, 1500)
            self.assertEqual(items[0]["price"], 1291)

        def test_category_selection_is_stable(self):
            other = {**self.row, "id": "1.3", "itemId": "3", "source": "https://shopee.co.th/product/1/3",
                     "category": {"id": "search-%E0%B8%A1%E0%B8%B8%E0%B8%81", "name": {"en": "Care", "th": "ดูแลตัวเอง"}}}
            a, categories, _ = select_rows([self.row, other], self.now, 24, 2)
            b, _, _ = select_rows([other, self.row], self.now, 24, 2)
            self.assertEqual(a, b)
            self.assertEqual(sum(category["count"] for category in categories), 2)
            self.assertIsNone(a[0]["size"])
            self.assertTrue(all(re.fullmatch(r"q-[a-f0-9]{12}", item["category"]) for item in a))

        def test_explicit_demo_curation_keeps_ordinary_craft_products(self):
            with self.assertRaises(InvalidObservation):
                validate_row({**self.row, "name": "บุหรี่ test"}, self.now, 24)
            item, _, _ = validate_row({**self.row, "name": "ปืนกาว งานประดิษฐ์"}, self.now, 24)
            self.assertEqual(item["name"]["th"], "ปืนกาว งานประดิษฐ์")

        def test_rate_limit_stops_downloads(self):
            item, _, _ = validate_row(self.row, self.now, 24)
            stopped = Event()

            class BlockedOpener:
                def open(self, request, timeout):
                    raise HTTPError(request.full_url, 429, "Too Many Requests", {}, None)

            with TemporaryDirectory() as directory, patch(
                f"{__name__}.build_opener", return_value=BlockedOpener()
            ):
                with self.assertRaises(DownloadBlocked):
                    download_image(item, Path(directory), stopped, 15)
                self.assertTrue(stopped.is_set())

        def test_missing_image_source_never_reads_old_cache(self):
            item, _, _ = validate_row({**self.row, "imageSource": None}, self.now, 24)
            with TemporaryDirectory() as directory, patch(f"{__name__}.build_opener") as opener:
                (Path(directory) / "1.2.source").write_bytes(b"\xff")
                self.assertEqual(download_image(item, Path(directory), Event(), 15)["error"], "no image observed")
                opener.assert_not_called()

    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(BoundaryTests))
    if not result.wasSuccessful():
        raise SystemExit(1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("/private/tmp/shopee-live-observations.json"))
    parser.add_argument("--output", type=Path, default=ROOT / "data/shopee/catalog.json")
    parser.add_argument("--limit", type=int, choices=range(1, 1501), default=1500, metavar="1..1500")
    parser.add_argument("--require-count", type=int, default=0)
    parser.add_argument("--max-age-hours", type=int, choices=range(1, 25), default=24, metavar="1..24")
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=4)
    parser.add_argument("--timeout", type=int, choices=range(1, 31), default=15, metavar="1..30")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--no-images", action="store_true", help="Local development only: keep image null and preserve source URL")
    parser.add_argument("--cache-only", action="store_true", help="Cache selected original photos without publishing catalog.json")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if not 0 <= args.require_count <= args.limit:
        parser.error("--require-count must be between zero and --limit")
    raw_bytes = args.input.read_bytes()
    if len(raw_bytes) > 50 * 1024 * 1024:
        raise InvalidObservation("observation file exceeds 50 MiB")
    raw = json.loads(raw_bytes)
    rows = raw.get("rows") if isinstance(raw, dict) else raw
    if not isinstance(rows, list) or len(rows) > 10000:
        raise InvalidObservation("input must contain at most 10,000 observed rows")
    now = datetime.now(timezone.utc)
    items, categories, audit = select_rows(rows, now, args.max_age_hours, args.limit)
    summary = {key: value for key, value in audit.items() if key not in ("rejected", "selectedInputRows")}
    summary["rejectionReasons"] = dict(Counter(entry["reason"] for entry in audit["rejected"]))
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    if len(items) < args.require_count:
        raise InvalidObservation(f"need {args.require_count} valid unique observations; found {len(items)}")
    if not items:
        raise InvalidObservation("no valid current observations; previous catalog is unchanged")
    if args.validate_only:
        return 0
    image_results = []
    if not args.no_images:
        image_directory = args.output.parent / "images"
        image_directory.mkdir(parents=True, exist_ok=True)
        stopped = Event()
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(download_image, item, image_directory, stopped, args.timeout) for item in items]
            try:
                for future in as_completed(futures):
                    image_results.append(future.result())
                    if len(image_results) % 100 == 0:
                        print(json.dumps({"imagesChecked": len(image_results), "selectedRows": len(items)}), flush=True)
            except DownloadBlocked:
                stopped.set()
                for future in futures:
                    future.cancel()
                raise
        cached = {result["id"] for result in image_results if result.get("cached")}
        for item in items:
            if item["id"] in cached:
                item["image"] = f"/api/catalog/images/{item['id']}"
    if args.cache_only:
        atomic_json(args.output.parent / "image-cache-audit.json", {
            "inputSha256": hashlib.sha256(raw_bytes).hexdigest(),
            "audit": audit, "images": sorted(image_results, key=lambda result: result["id"]),
        })
        print(json.dumps({"cachedImages": sum(item["image"] is not None for item in items),
                          "uncachedImages": sum(item["image"] is None for item in items),
                          "catalogPublished": False}))
        return 0
    stamp = now.isoformat().replace("+00:00", "Z")
    digest = hashlib.sha256(raw_bytes).hexdigest()
    snapshot = {
        "items": items,
        "categories": categories,
        "snapshot": {
            "id": f"shopee-observed-{digest[:16]}",
            "source": "https://shopee.co.th/",
            "observedAt": min(item["observedAt"] for item in items),
            "importedAt": stamp,
            "total": len(items),
        },
    }
    provenance = {
        "inputSha256": digest,
        "importedAt": stamp,
        "method": "visible public Shopee page observations; exact listed price; no checkout-price inference",
        "rawRows": rows,
        "audit": audit,
        "images": sorted(image_results, key=lambda result: result["id"]),
    }
    atomic_json(args.output.parent / "provenance.json", provenance)
    atomic_json(args.output, snapshot)
    print(json.dumps({"output": str(args.output), "total": len(items),
                      "cachedImages": sum(item["image"] is not None for item in items),
                      "uncachedImages": sum(item["image"] is None for item in items)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (InvalidObservation, DownloadBlocked, OSError, json.JSONDecodeError) as error:
        print(f"Import stopped: {error}", file=sys.stderr)
        raise SystemExit(1)
