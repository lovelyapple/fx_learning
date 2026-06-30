"""API routing layer - thin, delegates to services."""

from fastapi import APIRouter, Query
from app.core import get_settings
from app.models import ChartResponse, ChatRequest, ChatResponse, LivePriceResponse
from app.services.fx_data_service import fetch_candles, fetch_live_price
from app.services.indicator_service import calculate_indicators
from app.services.ai_chat_service import chat_with_ai
from app.db.chat_repository import (
    save_chat_message,
    save_hypothesis,
    load_chat_history,
    load_hypotheses,
    resolve_hypothesis,
)

router = APIRouter(prefix="/api")


@router.get("/chart", response_model=ChartResponse)
async def get_chart(
    pair: str = Query(default=""),
    interval: str = Query(default=""),
    period: str = Query(default=""),
):
    """Get candlestick data with technical indicators."""
    settings = get_settings()

    # Validate inputs via whitelist
    pair = settings.validate_pair(pair) if pair else settings.default_pair
    interval = settings.validate_interval(interval) if interval else settings.default_interval
    period = settings.validate_period(period) if period else settings.default_period

    candles = fetch_candles(pair=pair, interval=interval, period=period)
    indicators = calculate_indicators(candles)

    latest_ts = candles[-1].timestamp if candles else None

    return ChartResponse(
        pair=pair,
        interval=interval,
        period=period,
        latest_timestamp=latest_ts,
        candles=candles,
        indicators=indicators,
    )


@router.post("/chat", response_model=ChatResponse)
async def post_chat(request: ChatRequest, session_id: str = Query(default="default")):
    """Chat with AI using current chart context."""
    settings = get_settings()

    # Backend fetches chart data - never trust client-supplied chart context
    pair = settings.validate_pair(request.pair) if request.pair else settings.default_pair
    interval = settings.validate_interval(request.interval) if request.interval else settings.default_interval
    period = settings.validate_period(request.period) if request.period else settings.default_period

    candles = fetch_candles(pair=pair, interval=interval, period=period)
    indicators = calculate_indicators(candles)

    # Limit context to recent N candles
    context_size = settings.ai_context_candles
    recent_candles = candles[-context_size:]
    recent_indicators = indicators[-context_size:]

    response = await chat_with_ai(
        message=request.message,
        history=request.history,
        candles=recent_candles,
        indicators=recent_indicators,
        selected_candles=request.selected_candles or [],
        pair=pair,
        interval=interval,
    )

    # Save to DB
    save_chat_message(session_id, "user", request.message)
    save_chat_message(session_id, "assistant", response.message)
    if response.hypothesis:
        save_hypothesis(session_id, pair, interval, response.hypothesis)

    return response


@router.get("/chat/history")
async def get_chat_history(session_id: str = Query(default="default"), limit: int = Query(default=50)):
    """Get chat history for a session."""
    return {"messages": load_chat_history(session_id, limit)}


@router.get("/hypotheses")
async def get_hypotheses(session_id: str = Query(default="default"), limit: int = Query(default=20)):
    """Get saved hypotheses for a session."""
    return {"hypotheses": load_hypotheses(session_id, limit)}


@router.post("/hypotheses/{hypothesis_id}/resolve")
async def resolve_hypothesis_endpoint(hypothesis_id: int, outcome: str = Query(...)):
    """Mark a hypothesis as resolved. outcome: correct, incorrect, invalidated"""
    if outcome not in ("correct", "incorrect", "invalidated"):
        return {"error": "outcome must be: correct, incorrect, or invalidated"}
    resolve_hypothesis(hypothesis_id, outcome)
    return {"status": "ok"}


@router.get("/indicators")
async def get_available_indicators():
    """Return list of available technical indicators."""
    return {
        "indicators": [
            {"id": "sma_20", "name": "SMA (20)", "category": "trend", "description": "20期間単純移動平均線"},
            {"id": "sma_50", "name": "SMA (50)", "category": "trend", "description": "50期間単純移動平均線"},
            {"id": "ema_12", "name": "EMA (12)", "category": "trend", "description": "12期間指数移動平均線"},
            {"id": "ema_26", "name": "EMA (26)", "category": "trend", "description": "26期間指数移動平均線"},
            {"id": "bb", "name": "ボリンジャーバンド", "category": "volatility", "description": "価格変動の標準偏差バンド"},
            {"id": "rsi", "name": "RSI (14)", "category": "momentum", "description": "相対力指数（買われすぎ/売られすぎ）"},
            {"id": "macd", "name": "MACD", "category": "momentum", "description": "移動平均収束拡散法"},
        ]
    }


@router.get("/price", response_model=LivePriceResponse)
async def get_live_price(pair: str = Query(default="")):
    """Get live price using fast_info (lower latency than candle API)."""
    settings = get_settings()
    pair = settings.validate_pair(pair) if pair else settings.default_pair
    return fetch_live_price(pair)
