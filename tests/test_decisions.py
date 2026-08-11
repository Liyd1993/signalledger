from signalledger.models import Decision, DecisionStatus


def test_new_evidence_marks_current_decision_for_review():
    decision = Decision(question="Should we build scheduled exports?", status=DecisionStatus.CURRENT)
    decision.mark_for_review("Enterprise admin requests scheduled exports")
    assert decision.status is DecisionStatus.NEEDS_REVIEW
    assert "Enterprise admin" in decision.change_reason
