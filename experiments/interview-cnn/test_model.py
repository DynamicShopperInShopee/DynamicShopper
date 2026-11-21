import itertools
import unittest

import torch

from model import QUESTIONS, OPTIONS, HEADS, InterviewCNN, encode, propose, sanitize


class PoisonedModel:
    def __call__(self, _):
        return {"theme": torch.tensor([[0., 0., 100., 0.]])}


class InterviewTests(unittest.TestCase):
    def test_convolution_layers_receive_gradients(self):
        model = InterviewCNN()
        answers = dict(zip(QUESTIONS, [OPTIONS[k][0] for k in QUESTIONS]))
        output, trace = model(encode([answers]), trace=True)
        sum(v.square().sum() for v in output.values()).backward()
        self.assertEqual(list(trace["conv1_relu"].shape), [1, 16, 4])
        self.assertEqual(list(trace["conv2_relu"].shape), [1, 24, 4])
        for layer in [model.conv1, model.conv2]:
            self.assertGreater(layer.weight.grad.abs().sum().item(), 0)

    def test_skip_and_invalid_fields_preserve_valid_siblings(self):
        answers, dropped = sanitize({"goal": "compare", "reading": "<script>", "price": 1})
        self.assertEqual(answers, {"goal": "compare"})
        self.assertEqual(dropped, ["reading", "unknown-field"])
        self.assertEqual(propose(None)[0]["patch"], {})
        patch = propose({"priority": "durability"})[0]["patch"]
        self.assertEqual(set(patch), {"priorities"})

    def test_all_answer_and_skip_combinations_are_bounded_offline(self):
        count = 0
        for values in itertools.product(*(OPTIONS[k] + [None] for k in QUESTIONS)):
            answers = {k: v for k, v in zip(QUESTIONS, values) if v is not None}
            patch = propose(answers)[0]["patch"]
            self.assertLessEqual(set(patch), {"theme", "layout", "density", "details", "sections", "priorities"})
            if "sections" in patch:
                self.assertIn("products", patch["sections"])
            if "details" in patch:
                self.assertIn("price", patch["details"])
            count += 1
        self.assertEqual(count, 625)

    def test_poisoned_model_cannot_override_large_print_or_locked_theme(self):
        answers = {"goal": "compare", "evidence": "specs", "priority": "durability", "reading": "large"}
        patch = propose(answers, PoisonedModel())[0]["patch"]
        self.assertEqual(patch["theme"], "large-print")
        self.assertEqual(patch["layout"], "table")
        self.assertEqual(patch["density"], "spacious")
        answers["reading"] = "comfortable"
        self.assertNotIn("theme", propose(answers, PoisonedModel(), locked=("theme",))[0]["patch"])

    def test_incomplete_answers_never_call_model(self):
        class Unavailable:
            def __call__(self, _):
                raise AssertionError("must not infer missing answers")
        self.assertEqual(propose({"goal": "browse"}, Unavailable())[1]["backend"], "rules")

    def test_model_failure_keeps_explicit_answers(self):
        class Unavailable:
            def __call__(self, _):
                raise RuntimeError("model unavailable")
        answers = dict(zip(QUESTIONS, [OPTIONS[k][0] for k in QUESTIONS]))
        self.assertEqual(propose(answers, Unavailable())[0], propose(answers)[0])

    def test_questionnaire_is_bilingual(self):
        from model import INTERVIEW
        for question in INTERVIEW["questions"]:
            for row in [question, *question["options"]]:
                self.assertTrue(row["en"] and row["th"])


if __name__ == "__main__":
    unittest.main()
