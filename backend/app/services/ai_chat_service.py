"""AI Chat service using GitHub Models API.

Handles conversation with chart context injection.
"""

import httpx
import json
import logging
import re
from datetime import datetime

from app.core import get_settings
from app.models import (
    CandleData,
    IndicatorData,
    ChatMessage,
    ChatResponse,
    HypothesisData,
)
from app.db.candle_repository import search_candles_by_pattern

logger = logging.getLogger(__name__)


async def chat_with_ai(
    message: str,
    history: list[ChatMessage],
    candles: list[CandleData],
    indicators: list[IndicatorData],
    selected_candles: list[CandleData] | None = None,
    pair: str = "USDJPY=X",
    interval: str = "1m",
) -> ChatResponse:
    """Send a message to AI with chart context.

    Args:
        message: User's message
        history: Conversation history
        candles: Recent candle data (backend-provided, not user-supplied)
        indicators: Recent indicator data

    Returns:
        ChatResponse with message and optional hypothesis
    """
    settings = get_settings()

    if not settings.github_token:
        return ChatResponse(
            message="GitHub Token が設定されていません。.env ファイルに GITHUB_TOKEN を設定してください。"
        )

    system_prompt = settings.load_system_prompt()
    chart_context = _build_chart_context(candles, indicators, selected_candles or [])
    selected_context = _build_selected_context(selected_candles or [])
    search_context, search_candles = _build_search_context(message, pair, interval)

    messages = [
        {"role": "system", "content": f"{system_prompt}\n\n## 現在のチャート状況\n{chart_context}{selected_context}{search_context}"},
    ]

    # Add history (limited)
    for msg in history[-settings.max_chat_history:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": message})

    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(
                f"{settings.github_models_endpoint}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.github_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.ai_model_name,
                    "messages": messages,
                    "max_tokens": settings.ai_max_tokens,
                    "temperature": settings.ai_temperature,
                },
            )
            response.raise_for_status()
            data = response.json()

    except httpx.TimeoutException:
        return ChatResponse(message="AI応答がタイムアウトしました。もう一度お試しください。")
    except httpx.HTTPStatusError as e:
        logger.error(f"AI API error: {e.response.status_code}")
        return ChatResponse(message="AI APIでエラーが発生しました。しばらく待ってから再試行してください。")
    except Exception as e:
        logger.error(f"Unexpected error in AI chat: {e}")
        return ChatResponse(message="予期しないエラーが発生しました。")

    ai_message = data["choices"][0]["message"]["content"]
    ref_candles = _extract_ref_candles(ai_message)
    ref_chart = _extract_ref_chart(ai_message)
    clean_message = _strip_ref_markers(ai_message)
    hypothesis = _extract_hypothesis(clean_message)

    # ref_chart のタイムスタンプを解決（1-indexed）
    ref_chart_timestamps: list[str] | None = None
    if ref_chart and search_candles:
        ref_chart_timestamps = [
            search_candles[i - 1].timestamp.isoformat()
            for i in ref_chart
            if 1 <= i <= len(search_candles)
        ] or None

    return ChatResponse(
        message=clean_message,
        hypothesis=hypothesis,
        ref_candles=ref_candles,
        ref_chart=ref_chart,
        ref_chart_timestamps=ref_chart_timestamps,
    )


def _build_chart_context(
    candles: list[CandleData],
    indicators: list[IndicatorData],
    selected_candles: list[CandleData] | None = None,
) -> str:
    """Build a summary of chart data for AI context."""
    if not candles:
        return "チャートデータなし"

    latest = candles[-1]
    reference = selected_candles[-1] if selected_candles else latest
    context_parts = [
        f"通貨ペア: USD/JPY",
        f"最新価格: {latest.close}（最新足: {latest.timestamp.isoformat()}）",
        f"基準価格（仮説の基点）: {reference.close}（{reference.timestamp.isoformat()}）",
        f"データ本数: {len(candles)}本",
    ]

    highs = [c.high for c in candles]
    lows = [c.low for c in candles]
    context_parts.append(f"期間高値: {max(highs)}")
    context_parts.append(f"期間安値: {min(lows)}")

    if indicators:
        latest_ind = indicators[-1]
        ind_parts = []
        if latest_ind.sma_20 is not None:
            ind_parts.append(f"SMA20: {latest_ind.sma_20}")
        if latest_ind.sma_50 is not None:
            ind_parts.append(f"SMA50: {latest_ind.sma_50}")
        if latest_ind.rsi is not None:
            ind_parts.append(f"RSI: {latest_ind.rsi}")
        if latest_ind.macd is not None:
            ind_parts.append(f"MACD: {latest_ind.macd}")
        if latest_ind.macd_signal is not None:
            ind_parts.append(f"MACD Signal: {latest_ind.macd_signal}")
        if latest_ind.bb_upper is not None:
            ind_parts.append(f"BB上限: {latest_ind.bb_upper}")
        if latest_ind.bb_lower is not None:
            ind_parts.append(f"BB下限: {latest_ind.bb_lower}")
        if ind_parts:
            context_parts.append("テクニカル指標: " + ", ".join(ind_parts))
        if latest_ind.sma_20 and latest_ind.sma_50:
            if latest_ind.sma_20 > latest_ind.sma_50:
                context_parts.append("トレンド: 短期MA > 長期MA（上昇傾向）")
            else:
                context_parts.append("トレンド: 短期MA < 長期MA（下降傾向）")
        if latest_ind.rsi:
            if latest_ind.rsi > 70:
                context_parts.append("RSI状態: 買われすぎ圏")
            elif latest_ind.rsi < 30:
                context_parts.append("RSI状態: 売られすぎ圏")

    return "\n".join(context_parts)


def _build_selected_context(selected_candles: list[CandleData]) -> str:
    """Build a detailed summary of user-selected candles."""
    if not selected_candles:
        return ""

    first = selected_candles[0]
    last = selected_candles[-1]
    highs = [c.high for c in selected_candles]
    lows = [c.low for c in selected_candles]
    opens = [c.open for c in selected_candles]
    closes = [c.close for c in selected_candles]

    up_count = sum(1 for c in selected_candles if c.close >= c.open)
    down_count = len(selected_candles) - up_count
    net_change = round(last.close - first.open, 3)
    net_pct = round((net_change / first.open) * 100, 3)

    lines = [
        f"\n## ユーザーが選択したローソク足（{len(selected_candles)}本）",
        f"期間: {first.timestamp} 〜 {last.timestamp}",
        f"始値: {first.open}　終値: {last.close}",
        f"期間高値: {max(highs)}　期間安値: {min(lows)}",
        f"変動幅: {net_change} ({net_pct}%)",
        f"陽線: {up_count}本　陰線: {down_count}本",
        f"※ 仮説を立てる場合はこの選択足の終値 {last.close} を base_price として使うこと。最新足の価格ではない。",
        "OHLC一覧:",
    ]
    for i, c in enumerate(selected_candles, 1):
        direction = "↑" if c.close >= c.open else "↓"
        lines.append(f"  #{i} {c.timestamp} {direction} O:{c.open} H:{c.high} L:{c.low} C:{c.close}")

    return "\n".join(lines)


def _build_search_context(message: str, pair: str, interval: str) -> tuple[str, list[CandleData]]:
    """Search DB for candles matching pattern keywords in the user message.

    Uses rule-based SQL queries (no LLM needed for search).
    Returns a context block with matching candles and their C#N references,
    plus the list of matched candles for timestamp resolution.
    """
    pattern_keywords = ["陽線", "大陽線", "小陽線", "陰線", "大陰線", "小陰線", "ドジ", "ハンマー", "上影線", "下影線"]
    found_pattern = next((kw for kw in pattern_keywords if kw in message), None)
    if not found_pattern:
        return "", []

    results = search_candles_by_pattern(pair, interval, found_pattern, limit=3)
    if not results:
        return f"\n\n## 検索結果：「{found_pattern}」\nDBに該当するローソク足が見つかりませんでした。", []

    lines = [
        f"\n\n## 検索結果：「{found_pattern}」（DBから{len(results)}本）",
        f"以下のローソク足が「{found_pattern}」の条件に合致します。C#番号でref_chartに指定できます。",
    ]
    for i, c in enumerate(results, 1):
        direction = "↑陽線" if c.close >= c.open else "↓陰線"
        body_ratio = abs(c.close - c.open) / (c.high - c.low) if c.high != c.low else 0
        lines.append(
            f"  C#{i} {c.timestamp} {direction} O:{c.open} H:{c.high} L:{c.low} C:{c.close} "
            f"（ボディ比率{body_ratio:.0%}）"
        )
    lines.append(f"※ 回答でこれらの足を参照する場合は <!-- ref_chart:[1,2] --> 形式で末尾に付けてください。")

    return "\n".join(lines), results


def _extract_hypothesis(ai_message: str) -> HypothesisData | None:
    """Try to extract structured hypothesis from AI response."""
    try:
        # Look for JSON block in the response
        json_start = ai_message.find("```json")
        if json_start == -1:
            json_start = ai_message.find("{")
            if json_start == -1:
                return None
            json_end = ai_message.rfind("}") + 1
        else:
            json_start = ai_message.find("{", json_start)
            json_end = ai_message.find("```", json_start)
            if json_end == -1:
                json_end = ai_message.rfind("}") + 1
            else:
                json_end = ai_message.rfind("}", json_start, json_end) + 1

        if json_start == -1 or json_end <= json_start:
            return None

        json_str = ai_message[json_start:json_end]
        data = json.loads(json_str)

        # Validate required fields
        if "direction" not in data or "base_price" not in data:
            return None

        return HypothesisData(
            direction=data.get("direction", "sideways"),
            confidence=data.get("confidence", "low"),
            base_price=float(data["base_price"]),
            entry_price=data.get("entry_price"),
            target_price=data.get("target_price"),
            stop_price=data.get("stop_price"),
            horizon_candles=data.get("horizon_candles"),
            invalidation_condition=data.get("invalidation_condition"),
            reasoning=data.get("reasoning", ""),
            indicators_used=data.get("indicators_used", []),
        )
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.debug(f"Could not extract hypothesis: {e}")
        return None


def _extract_ref_candles(ai_message: str) -> list[int] | None:
    """Extract selected-candle references from <!-- ref_candles:[1,2] --> marker."""
    match = re.search(r'<!--\s*ref_candles:\s*\[([^\]]*)\]\s*-->', ai_message)
    if not match:
        return None
    nums = [int(n.strip()) for n in match.group(1).split(',') if n.strip().isdigit()]
    return nums if nums else None


def _extract_ref_chart(ai_message: str) -> list[int] | None:
    """Extract chart-candle references from <!-- ref_chart:[5,6] --> marker."""
    match = re.search(r'<!--\s*ref_chart:\s*\[([^\]]*)\]\s*-->', ai_message)
    if not match:
        return None
    nums = [int(n.strip()) for n in match.group(1).split(',') if n.strip().isdigit()]
    return nums if nums else None


def _strip_ref_markers(ai_message: str) -> str:
    """Remove all ref markers from the message for clean display."""
    msg = re.sub(r'\s*<!--\s*ref_candles:\s*\[[^\]]*\]\s*-->', '', ai_message)
    msg = re.sub(r'\s*<!--\s*ref_chart:\s*\[[^\]]*\]\s*-->', '', msg)
    return msg.strip()
