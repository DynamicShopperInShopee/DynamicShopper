"""Inspect a local interview proposal; never applies changes to the storefront."""
import argparse
import json

import torch

from model import ROOT, HEADS, InterviewCNN, encode, propose, sanitize


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("answers", help='JSON object of question IDs and answer IDs')
    parser.add_argument("--lock-theme", action="store_true", help="Preserve an existing explicit theme")
    args = parser.parse_args()
    raw = json.loads(args.answers)
    model = None
    checkpoint = ROOT / "results/model.pt"
    if checkpoint.exists():
        model = InterviewCNN()
        model.load_state_dict(torch.load(checkpoint, map_location="cpu", weights_only=True))
        model.eval()
    proposal, decision = propose(raw, model, locked=("theme",) if args.lock_theme else ())
    output = {"proposal": proposal, "decision": decision}
    answers, _ = sanitize(raw)
    if model is not None and len(answers) == 4:
        with torch.no_grad():
            heads, layers = model(encode([answers]), trace=True)
        output["raw_predictions"] = {k: HEADS[k][int(v.argmax(1))] for k, v in heads.items()}
        output["layer_shapes"] = {k: list(v.shape) for k, v in layers.items()}
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
