"""Export the trained weights and PyTorch reference outputs for offline browser inference."""
import itertools
import json

import torch

from model import ROOT, INTERVIEW, QUESTIONS, OPTIONS, HEADS, DETAILS, SECTIONS, InterviewCNN, encode


def main():
    model = InterviewCNN()
    model.load_state_dict(torch.load(ROOT / 'results/model.pt', weights_only=True, map_location='cpu'))
    model.eval()
    artifact = {
        'version': 'interview-cnn-v1', 'training': 'synthetic', 'seed': 7,
        'interview': INTERVIEW, 'heads': HEADS, 'details': DETAILS, 'sections': SECTIONS,
        'weights': {key: value.tolist() for key, value in model.state_dict().items()}
    }
    destination = ROOT.parent.parent / 'src/lib/personalization/cnn-weights.json'
    destination.write_text(json.dumps(artifact, ensure_ascii=False, separators=(',', ':')) + '\n')
    rows = [dict(zip(QUESTIONS, values)) for values in itertools.product(*(OPTIONS[k] for k in QUESTIONS))]
    with torch.no_grad():
        outputs = model(encode(rows))
    reference = [{'answers': row, 'logits': {key: values[i].tolist() for key, values in outputs.items()}}
                 for i, row in enumerate(rows)]
    (ROOT / 'results/browser-reference.json').write_text(json.dumps(reference, separators=(',', ':')) + '\n')
    print(f'Exported {destination.name}; {len(rows)} PyTorch reference cases')


if __name__ == '__main__':
    main()
