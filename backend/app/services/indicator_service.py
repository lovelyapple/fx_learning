"""Technical indicator calculation service.

Uses the 'ta' library to compute indicators from candle data.
"""

import pandas as pd
import ta
from datetime import datetime

from app.models import CandleData, IndicatorData


def calculate_indicators(candles: list[CandleData]) -> list[IndicatorData]:
    """Calculate technical indicators from candle data.

    Computes: SMA(20), SMA(50), EMA(12), EMA(26),
    Bollinger Bands, RSI(14), MACD(12,26,9)

    Args:
        candles: List of candlestick data

    Returns:
        List of IndicatorData with computed values
    """
    if not candles:
        return []

    # Build DataFrame from candles
    df = pd.DataFrame([c.model_dump() for c in candles])
    df.set_index("timestamp", inplace=True)
    close = df["close"]
    high = df["high"]
    low = df["low"]

    # Moving Averages
    sma_20 = ta.trend.sma_indicator(close, window=20)
    sma_50 = ta.trend.sma_indicator(close, window=50)
    ema_12 = ta.trend.ema_indicator(close, window=12)
    ema_26 = ta.trend.ema_indicator(close, window=26)

    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    bb_upper = bb.bollinger_hband()
    bb_middle = bb.bollinger_mavg()
    bb_lower = bb.bollinger_lband()

    # RSI
    rsi = ta.momentum.rsi(close, window=14)

    # MACD
    macd_obj = ta.trend.MACD(close, window_slow=26, window_fast=12, window_sign=9)
    macd_line = macd_obj.macd()
    macd_signal = macd_obj.macd_signal()
    macd_hist = macd_obj.macd_diff()

    # Build result
    indicators = []
    for i, ts in enumerate(df.index):
        indicators.append(
            IndicatorData(
                timestamp=ts,
                sma_20=_safe_round(sma_20.iloc[i]),
                sma_50=_safe_round(sma_50.iloc[i]),
                ema_12=_safe_round(ema_12.iloc[i]),
                ema_26=_safe_round(ema_26.iloc[i]),
                bb_upper=_safe_round(bb_upper.iloc[i]),
                bb_middle=_safe_round(bb_middle.iloc[i]),
                bb_lower=_safe_round(bb_lower.iloc[i]),
                rsi=_safe_round(rsi.iloc[i]),
                macd=_safe_round(macd_line.iloc[i]),
                macd_signal=_safe_round(macd_signal.iloc[i]),
                macd_histogram=_safe_round(macd_hist.iloc[i]),
            )
        )

    return indicators


def _safe_round(value, decimals: int = 3) -> float | None:
    """Round value safely, returning None for NaN."""
    if pd.isna(value):
        return None
    return round(float(value), decimals)
