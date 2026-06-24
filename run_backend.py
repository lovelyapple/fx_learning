"""Backend entry point. Run from project root."""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent / "backend"
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
