"""Database repository for candle data."""

from datetime import datetime

from app.db import get_connection
from app.models import CandleData


def save_candles(pair: str, interval: str, candles: list[CandleData]) -> int:
    """Save candle data to database. Upserts on (pair, interval, timestamp).

    Returns:
        Number of rows inserted/updated.
    """
    if not candles:
        return 0

    now = datetime.now().isoformat()
    rows = [
        (
            pair,
            interval,
            c.timestamp.isoformat(),
            c.open,
            c.high,
            c.low,
            c.close,
            c.volume,
            now,
        )
        for c in candles
    ]

    with get_connection() as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO candles
                (pair, interval, timestamp, open, high, low, close, volume, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    return len(rows)


def load_candles(
    pair: str,
    interval: str,
    limit: int = 500,
    since: datetime | None = None,
) -> list[CandleData]:
    """Load candle data from database.

    Args:
        pair: Currency pair
        interval: Candle interval
        limit: Max number of candles to return
        since: Only return candles after this timestamp

    Returns:
        List of CandleData sorted by timestamp ascending
    """
    with get_connection() as conn:
        if since:
            rows = conn.execute(
                """
                SELECT timestamp, open, high, low, close, volume
                FROM candles
                WHERE pair = ? AND interval = ? AND timestamp >= ?
                ORDER BY timestamp ASC
                LIMIT ?
                """,
                (pair, interval, since.isoformat(), limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT timestamp, open, high, low, close, volume
                FROM candles
                WHERE pair = ? AND interval = ?
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (pair, interval, limit),
            ).fetchall()
            rows = list(reversed(rows))

    return [
        CandleData(
            timestamp=datetime.fromisoformat(row["timestamp"]),
            open=row["open"],
            high=row["high"],
            low=row["low"],
            close=row["close"],
            volume=row["volume"],
        )
        for row in rows
    ]


def get_latest_timestamp(pair: str, interval: str) -> datetime | None:
    """Get the most recent candle timestamp for a pair/interval."""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT MAX(timestamp) as latest
            FROM candles
            WHERE pair = ? AND interval = ?
            """,
            (pair, interval),
        ).fetchone()

    if row and row["latest"]:
        return datetime.fromisoformat(row["latest"])
    return None
