"""Data models for FX candle data and technical indicators."""

from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Literal


class CandleData(BaseModel):
    """Single candlestick data point."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class IndicatorData(BaseModel):
    """Technical indicator values at a point in time."""
    timestamp: datetime
    sma_20: float | None = None
    sma_50: float | None = None
    ema_12: float | None = None
    ema_26: float | None = None
    bb_upper: float | None = None
    bb_middle: float | None = None
    bb_lower: float | None = None
    rsi: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    macd_histogram: float | None = None


class ChartResponse(BaseModel):
    """Combined chart data response."""
    pair: str
    interval: str
    period: str
    source: str = "yfinance"
    is_realtime: bool = False
    delay_note: str = "データは最大15分遅延の可能性があります"
    latest_timestamp: datetime | None = None
    candles: list[CandleData] = Field(default_factory=list)
    indicators: list[IndicatorData] = Field(default_factory=list)


class ChatMessage(BaseModel):
    """Single chat message."""
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Chat request with chart context auto-injected by backend."""
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    pair: str = ""
    interval: str = ""
    period: str = ""
    selected_candles: list[CandleData] | None = None


class HypothesisData(BaseModel):
    """AI-generated hypothesis for chart visualization (学習用シナリオ)."""
    direction: Literal["up", "down", "sideways"]
    confidence: Literal["high", "medium", "low"]
    base_price: float
    entry_price: float | None = None
    target_price: float | None = None
    stop_price: float | None = None
    horizon_candles: int | None = None
    invalidation_condition: str | None = None
    reasoning: str
    indicators_used: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)


class ChatResponse(BaseModel):
    """Chat response from AI."""
    message: str
    hypothesis: HypothesisData | None = None
    ref_candles: list[int] | None = None
    ref_chart: list[int] | None = None
    ref_chart_timestamps: list[str] | None = None
    disclaimer: str = "これは学習用シナリオであり、投資助言ではありません。"


class LivePriceResponse(BaseModel):
    """Live price response using fast_info."""
    pair: str
    price: float
    fetched_at: datetime
