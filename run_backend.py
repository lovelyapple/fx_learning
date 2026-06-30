"""Backend entry point. Run from project root."""

import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent

# Auto-switch to venv Python if available and not already using it
if sys.platform == "win32":
    venv_python = root_dir / ".venv" / "Scripts" / "python.exe"
else:
    venv_python = root_dir / ".venv" / "bin" / "python3"

if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
    os.execv(str(venv_python), [str(venv_python)] + sys.argv)

# Add backend to path
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    from app.core import get_settings

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=True,
    )
