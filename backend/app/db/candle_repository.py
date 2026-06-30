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


def search_candles_by_pattern(
    pair: str,
    interval: str,
    pattern: str,
    limit: int = 5,
) -> list[CandleData]:
    """Search candles from DB by pattern name using SQL rules.

    Supported patterns: 陽線, 大陽線, 陰線, 大陰線, ドジ, ハンマー, 上影線, 下影線

    Args:
        pair: Currency pair
        interval: Candle interval
        pattern: Pattern name in Japanese
        limit: Max results to return

    Returns:
        List of matching CandleData, most recent first then shuffled for variety
    """
    # range = high - low (全体幅)
    # body = abs(close - open)
    # upper = high - max(open,close)
    # lower = min(open,close) - low
    base_where = "pair = ? AND interval = ? AND (high - low) > 0"
    params_base: list = [pair, interval]

    pattern_sql: dict[str, str] = {
        "陽線":   f"{base_where} AND close > open",
        "大陽線": f"{base_where} AND close > open AND (close - open) * 1.0 / (high - low) >= 0.6",
        "小陽線": f"{base_where} AND close > open AND (close - open) * 1.0 / (high - low) BETWEEN 0.3 AND 0.6",
        "陰線":   f"{base_where} AND close < open",
        "大陰線": f"{base_where} AND close < open AND (open - close) * 1.0 / (high - low) >= 0.6",
        "小陰線": f"{base_where} AND close < open AND (open - close) * 1.0 / (high - low) BETWEEN 0.3 AND 0.6",
        "ドジ":   f"{base_where} AND ABS(close - open) * 1.0 / (high - low) < 0.05",
        "ハンマー": (
            f"{base_where} AND (high - low) > 0 "
            f"AND (MIN(open,close) - low) * 1.0 / (high - low) >= 0.5 "
            f"AND ABS(close - open) * 1.0 / (high - low) <= 0.3"
        ),
        "上影線": (
            f"{base_where} "
            f"AND (high - MAX(open,close)) * 1.0 / (high - low) >= 0.5 "
            f"AND ABS(close - open) * 1.0 / (high - low) <= 0.3"
        ),
        "下影線": (
            f"{base_where} "
            f"AND (MIN(open,close) - low) * 1.0 / (high - low) >= 0.5 "
            f"AND ABS(close - open) * 1.0 / (high - low) <= 0.3"
        ),
    }

    # キーワード部分マッチ
    where_clause = None
    for key, sql in pattern_sql.items():
        if key in pattern:
            where_clause = sql
            break

    if not where_clause:
        return []

    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT timestamp, open, high, low, close, volume
            FROM candles
            WHERE {where_clause}
            ORDER BY RANDOM()
            LIMIT ?
            """,
            params_base + [limit],
        ).fetchall()

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
