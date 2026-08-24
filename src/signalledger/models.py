from dataclasses import dataclass, field
from enum import StrEnum


class DecisionStatus(StrEnum):
    CURRENT = "current"
    NEEDS_REVIEW = "needs_review"
    SUPERSEDED = "superseded"


@dataclass
class Decision:
    question: str
    status: DecisionStatus = DecisionStatus.CURRENT
    change_reason: str = ""

    def mark_for_review(self, reason: str) -> None:
        self.status = DecisionStatus.NEEDS_REVIEW
        self.change_reason = reason


@dataclass
class Recommendation:
    recommendation: str
    confidence: int
    rationale: str
    evidence_ids: list[str] = field(default_factory=list)
    validation_experiment: str = ""
