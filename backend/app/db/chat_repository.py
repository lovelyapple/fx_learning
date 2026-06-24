"""Database repository for chat history and hypotheses."""

import json
from datetime import datetime

from app.db import get_connection
from app.models import ChatMessage, HypothesisData


def save_chat_message(session_id: str, role: str, content: str) -> int:
    """Save a chat message to history.

    Returns:
        Inserted row ID.
    """
    now = datetime.now().isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO chat_history (session_id, role, content, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, role, content, now),
        )
    return cursor.lastrowid


def load_chat_history(session_id: str, limit: int = 50) -> list[ChatMessage]:
    """Load chat history for a session.

    Args:
        session_id: Session identifier
        limit: Max messages to return

    Returns:
        List of ChatMessage sorted by created_at ascending
    """
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT role, content
            FROM chat_history
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (session_id, limit),
        ).fetchall()

    return [
        ChatMessage(role=row["role"], content=row["content"])
        for row in reversed(rows)
    ]


def save_hypothesis(session_id: str, pair: str, interval: str, hypothesis: HypothesisData) -> int:
    """Save a hypothesis to database.

    Returns:
        Inserted row ID.
    """
    now = datetime.now().isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO hypotheses
                (session_id, pair, interval, direction, confidence,
                 base_price, entry_price, target_price, stop_price,
                 horizon_candles, invalidation_condition, reasoning,
                 indicators_used, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                pair,
                interval,
                hypothesis.direction,
                hypothesis.confidence,
                hypothesis.base_price,
                hypothesis.entry_price,
                hypothesis.target_price,
                hypothesis.stop_price,
                hypothesis.horizon_candles,
                hypothesis.invalidation_condition,
                hypothesis.reasoning,
                json.dumps(hypothesis.indicators_used),
                now,
            ),
        )
    return cursor.lastrowid


def load_hypotheses(session_id: str, limit: int = 20) -> list[dict]:
    """Load hypotheses for a session.

    Returns:
        List of hypothesis dicts with metadata
    """
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM hypotheses
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (session_id, limit),
        ).fetchall()

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "pair": row["pair"],
            "interval": row["interval"],
            "direction": row["direction"],
            "confidence": row["confidence"],
            "base_price": row["base_price"],
            "entry_price": row["entry_price"],
            "target_price": row["target_price"],
            "stop_price": row["stop_price"],
            "horizon_candles": row["horizon_candles"],
            "invalidation_condition": row["invalidation_condition"],
            "reasoning": row["reasoning"],
            "indicators_used": json.loads(row["indicators_used"]),
            "created_at": row["created_at"],
            "outcome": row["outcome"],
        })

    return results


def resolve_hypothesis(hypothesis_id: int, outcome: str) -> None:
    """Mark a hypothesis as resolved with an outcome.

    Args:
        hypothesis_id: ID of the hypothesis
        outcome: "correct", "incorrect", or "invalidated"
    """
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE hypotheses
            SET resolved_at = ?, outcome = ?
            WHERE id = ?
            """,
            (now, outcome, hypothesis_id),
        )
