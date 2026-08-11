import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from signalledger.app import lambda_handler as handler  # noqa: E402
