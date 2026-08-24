import json
from pathlib import Path


def load_feedback(path: Path | None = None) -> list[dict[str, object]]:
    source = path or Path(__file__).parents[2] / "data" / "feedback.json"
    return json.loads(source.read_text(encoding="utf-8"))
