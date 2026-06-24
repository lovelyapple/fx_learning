"""Frontend entry point. Run from project root."""

import subprocess
import sys
from pathlib import Path

frontend_dir = Path(__file__).resolve().parent / "frontend"

if __name__ == "__main__":
    if not (frontend_dir / "node_modules").exists():
        print("node_modules not found. Run setup first.")
        sys.exit(1)

    subprocess.run(
        ["npm", "run", "dev"],
        cwd=str(frontend_dir),
        shell=(sys.platform == "win32"),
    )
