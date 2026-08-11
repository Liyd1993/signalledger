from signalledger.data import load_feedback


def test_seed_data_is_synthetic_and_has_export_evidence():
    rows = load_feedback()
    assert len(rows) >= 10
    assert all(row["synthetic"] is True for row in rows)
    assert sum("export" in str(row["text"]).lower() for row in rows) >= 3
