# Sourced shopping preview

Run `npm run dev:shopping` and open `http://127.0.0.1:5176`. The preview
starts with seven dated listings and their photos. It can read a larger catalog
from a local service or use a previously verified offline release.

Shoppers can browse immediately or finish an optional interview. Each answer
sets a known presentation preference, skipped questions preserve the current
settings, and Finish applies the choices once. The change receipt offers
Undo and chat refinement. Three editable examples show the same catalog in
different layouts independently of the shopper’s view.

See the [shopping guide](../src/lib/mobile/README.md), the
[dataset guide](../catalogs/shopee-2026-11-21/README.md) and the
[local catalog API](../src/lib/server/catalog/README.md).
