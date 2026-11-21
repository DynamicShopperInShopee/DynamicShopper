"""Synthetic feasibility experiment, not a learned model of real shoppers."""
import json
from pathlib import Path

import torch
from torch import nn

ROOT = Path(__file__).resolve().parent
INTERVIEW = json.loads((ROOT / "interview.json").read_text())
QUESTIONS = [q["id"] for q in INTERVIEW["questions"]]
OPTIONS = {q["id"]: [o["id"] for o in q["options"]] for q in INTERVIEW["questions"]}
HEADS = {
    "theme": ["standard", "minimal", "vibrant", "large-print"],
    "layout": ["grid", "list", "table"],
    "density": ["comfortable", "compact", "spacious"],
    "details": OPTIONS["evidence"],
    "sections": OPTIONS["goal"],
    "priority": OPTIONS["priority"],
}
DETAILS = {
    "photos": ["image", "price", "rating", "shop", "shipping"],
    "specs": ["price", "specs", "rating", "shop", "shipping"],
    "reviews": ["price", "reviews", "rating", "shop", "shipping"],
    "summary": ["price", "summary", "image", "shop", "shipping"],
}
SECTIONS = {
    "browse": ["products"],
    "compare": ["what-matters", "products"],
    "shortlist": ["top-picks", "what-matters", "products"],
    "gift": ["top-picks", "reviews", "products"],
}


def sanitize(raw):
    """Only fixed IDs enter the model. Invalid siblings do not erase valid ones."""
    raw = raw if isinstance(raw, dict) else {}
    answers = {key: raw[key] for key in QUESTIONS
               if isinstance(raw.get(key), str) and raw[key] in OPTIONS[key]}
    dropped = [key for key in QUESTIONS if key in raw and key not in answers]
    if any(key not in QUESTIONS for key in raw):
        dropped.append("unknown-field")
    return answers, dropped


def encode(rows):
    # 4 semantic positions; 16 question-specific option channels + 4 position channels.
    # Absent answers encode as no selected option; never passed to CNN at inference.
    x = torch.zeros(len(rows), 20, 4)
    for n, raw in enumerate(rows):
        answers, _ = sanitize(raw)
        for position, key in enumerate(QUESTIONS):
            x[n, 16 + position, position] = 1
            if key in answers:
                x[n, 4 * position + OPTIONS[key].index(answers[key]), position] = 1
    return x


def rule_labels(a):
    """Authored design hypotheses, deliberately not human preference ground truth."""
    return {
        "theme": "large-print" if a["reading"] == "large" else
                 {"photos": "vibrant", "specs": "minimal"}.get(a["evidence"], "standard"),
        "layout": {"browse": "grid", "compare": "table", "shortlist": "list", "gift": "grid"}[a["goal"]],
        "density": "spacious" if a["reading"] == "large" else a["reading"],
        "details": a["evidence"], "sections": a["goal"], "priority": a["priority"],
    }


def direct_patch(a):
    """Explicit answers control their fields; skipped answers do not write fields."""
    patch = {}
    if "goal" in a:
        patch["layout"] = {"browse": "grid", "compare": "table", "shortlist": "list", "gift": "grid"}[a["goal"]]
        patch["sections"] = SECTIONS[a["goal"]].copy()
    if "evidence" in a:
        patch["details"] = DETAILS[a["evidence"]].copy()
    if "priority" in a:
        patch["priorities"] = {key: "first" if key == a["priority"] else "off"
                               for key in ["price", "performance", "durability", "design", "rating", "value"]}
    if "reading" in a:
        patch["density"] = "spacious" if a["reading"] == "large" else a["reading"]
        if a["reading"] == "large":
            patch["theme"] = "large-print"
    return patch


class InterviewCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv1d(20, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(16, 24, kernel_size=3, padding=1)
        self.dense = nn.Linear(24 * 4, 32)
        self.heads = nn.ModuleDict({key: nn.Linear(32, len(values)) for key, values in HEADS.items()})

    def forward(self, x, trace=False):
        local = torch.relu(self.conv1(x))
        combined = torch.relu(self.conv2(local))
        latent = torch.relu(self.dense(combined.flatten(1)))
        outputs = {key: head(latent) for key, head in self.heads.items()}
        if trace:
            return outputs, {"input": x, "conv1_relu": local, "conv2_relu": combined, "latent": latent}
        return outputs


def propose(raw, model=None, locked=()):
    answers, dropped = sanitize(raw)
    patch = direct_patch(answers)
    backend = "rules"
    # Missing or corrupt answers bypass the model; no unsupported imputation.
    if model is not None and len(answers) == len(QUESTIONS):
        try:
            with torch.no_grad():
                logits = model(encode([answers]))["theme"]
                if logits.shape != (1, len(HEADS["theme"])):
                    raise ValueError("invalid head shape")
                probabilities = logits[0].softmax(0)
            if torch.isfinite(probabilities).all() and probabilities.max().item() >= 0.8:
                theme = HEADS["theme"][int(probabilities.argmax())]
                # Explicit large text wins; inference cannot invent an accessibility need.
                if "theme" not in patch and theme != "large-print" and "theme" not in locked:
                    patch["theme"] = theme
                    backend = "cnn-theme-with-explicit-controls"
        except (RuntimeError, ValueError, TypeError, KeyError, IndexError, AttributeError):
            backend = "rules-model-unavailable"
    # No language inference, prices, catalog reads, HTML, prose, or product ordering.
    return {"intent": "change", "patch": patch}, {"backend": backend, "dropped": dropped}
