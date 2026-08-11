from signalledger.data import load_feedback
from signalledger.decision_engine import decide


def test_export_evidence_recommends_build_now():
    result = decide("Should we build scheduled CSV exports?", load_feedback())
    assert result.recommendation == "build_now"
    assert len(result.evidence_ids) >= 2


def test_one_source_never_returns_build_now():
    result = decide("Should we build scheduled CSV exports?", load_feedback()[:1])
    assert result.recommendation == "validate_first"
