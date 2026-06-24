"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import get_settings
from app.api import router
from app.db import init_db

settings = get_settings()

app = FastAPI(
    title="FX Learning App",
    description="AIと対話しながらFXテクニカル分析を学ぶ",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
async def startup():
    """Initialize database on app startup."""
    init_db()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
