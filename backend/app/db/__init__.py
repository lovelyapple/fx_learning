"""Database module - SQLite for persistent storage.

Stores: candle data, chat history, hypotheses.
"""

import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

from app.core import get_settings

logger = logging.getLogger(__name__)

# DB file location: project_root/data/fx_learning.db
_DB_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
_DB_PATH = _DB_DIR / "fx_learning.db"


def _get_db_path() -> Path:
    """Get database file path, ensuring directory exists."""
    _DB_DIR.mkdir(parents=True, exist_ok=True)
    return _DB_PATH


@contextmanager
def get_connection():
    """Get a database connection context manager."""
    conn = sqlite3.connect(str(_get_db_path()))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database tables."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS candles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair TEXT NOT NULL,
                interval TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume REAL NOT NULL,
                fetched_at TEXT NOT NULL,
                UNIQUE(pair, interval, timestamp)
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS hypotheses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                pair TEXT NOT NULL,
                interval TEXT NOT NULL,
                direction TEXT NOT NULL,
                confidence TEXT NOT NULL,
                base_price REAL NOT NULL,
                entry_price REAL,
                target_price REAL,
                stop_price REAL,
                horizon_candles INTEGER,
                invalidation_condition TEXT,
                reasoning TEXT NOT NULL,
                indicators_used TEXT NOT NULL,
                created_at TEXT NOT NULL,
                resolved_at TEXT,
                outcome TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_candles_pair_interval
                ON candles(pair, interval, timestamp);
            CREATE INDEX IF NOT EXISTS idx_chat_session
                ON chat_history(session_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_hypotheses_session
                ON hypotheses(session_id, created_at);
        """)
    logger.info("Database initialized")
