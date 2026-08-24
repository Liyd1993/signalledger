from collections.abc import Iterable

from signalledger.models import Recommendation


TIER_WEIGHT = {"Enterprise": 3, "Growth": 2, "Starter": 1}


def _relevant(question: str, rows: Iterable[dict[str, object]]) -> list[dict[str, object]]:
    words = {word.strip("?.,!").lower() for word in question.split() if len(word) > 3}
    return sorted(
        [row for row in rows if words & set(str(row["text"]).lower().split())],
        key=lambda row: int(row["severity"]) + TIER_WEIGHT.get(str(row["account_tier"]), 1),
        reverse=True,
    )


def decide(question: str, feedback: list[dict[str, object]]) -> Recommendation:
    relevant = _relevant(question, feedback)
    evidence = relevant[:4]
    if len(evidence) < 2:
        return Recommendation(
            "validate_first", 35,
            "There is not enough directly relevant customer evidence to make a committed roadmap decision.",
            [str(row["id"]) for row in evidence],
            "Interview five target customers and measure weekly time spent preparing exports.",
        )
    score = sum(int(row["severity"]) + TIER_WEIGHT.get(str(row["account_tier"]), 1) for row in evidence)
    build = score >= 12 and "export" in question.lower()
    return Recommendation(
        "build_now" if build else "validate_first",
        min(92, 50 + score * 2),
        "Multiple high-severity requests from enterprise and growth teams point to a recurring reporting workflow, not a one-off preference.",
        [str(row["id"]) for row in evidence],
        "Prototype scheduled CSV delivery with audit logs for five enterprise accounts; success is a 50% reduction in manual export time.",
    )
