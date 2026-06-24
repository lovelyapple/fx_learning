"""FX data service - fetches USD/JPY candle data.

Supports multiple data providers via provider pattern.
Falls back to mock data if external API is unavailable.
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

from app.core import get_settings
from app.models import CandleData

logger = logging.getLogger(__name__)


def fetch_candles(
    pair: str | None = None,
    interval: str | None = None,
    period: str | None = None,
) -> list[CandleData]:
    """Fetch candlestick data for the specified pair.

    Tries yfinance first, falls back to generated sample data for development.

    Args:
        pair: Currency pair symbol (e.g. "USDJPY=X")
        interval: Candle interval (e.g. "1h", "1d")
        period: Data period (e.g. "5d", "1mo")

    Returns:
        List of CandleData objects
    """
    settings = get_settings()
    pair = pair or settings.default_pair
    interval = interval or settings.default_interval
    period = period or settings.default_period

    # Try yfinance first
    candles = _fetch_from_yfinance(pair, interval, period)
    if candles:
        # Save to DB for persistence
        from app.db.candle_repository import save_candles
        save_candles(pair, interval, candles)
        return candles

    # Try loading from DB cache
    from app.db.candle_repository import load_candles
    cached = load_candles(pair, interval)
    if cached:
        logger.info(f"Loaded {len(cached)} candles from DB cache")
        return cached

    # Fallback to sample data for development
    logger.warning("yfinance unavailable and no cache, using generated sample data")
    sample = _generate_sample_data(pair, interval, period)

    # Save sample data to DB so it persists across restarts
    from app.db.candle_repository import save_candles
    save_candles(pair, interval, sample)

    return sample


def _fetch_from_yfinance(pair: str, interval: str, period: str) -> list[CandleData]:
    """Attempt to fetch data from yfinance."""
    try:
        ticker = yf.Ticker(pair)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return []

        candles = []
        for idx, row in df.iterrows():
            candles.append(
                CandleData(
                    timestamp=idx.to_pydatetime(),
                    open=round(row["Open"], 3),
                    high=round(row["High"], 3),
                    low=round(row["Low"], 3),
                    close=round(row["Close"], 3),
                    volume=row["Volume"],
                )
            )
        return candles

    except Exception as e:
        logger.warning(f"yfinance fetch failed: {e}")
        return []


def _generate_sample_data(pair: str, interval: str, period: str) -> list[CandleData]:
    """Generate realistic sample FX data for development/testing.

    Simulates USD/JPY price movement using random walk with drift.
    """
    settings = get_settings()

    # Determine number of candles based on period and interval
    interval_minutes = _interval_to_minutes(interval)
    total_minutes = _period_to_minutes(period)
    num_candles = min(total_minutes // interval_minutes, 500)

    # Base price for USD/JPY
    base_price = 155.0
    volatility = 0.0003  # Typical FX volatility per candle

    np.random.seed(int(datetime.now().timestamp()) % 10000)

    prices = [base_price]
    for _ in range(num_candles - 1):
        change = np.random.normal(0, volatility) * base_price
        prices.append(prices[-1] + change)

    now = datetime.now()
    start_time = now - timedelta(minutes=total_minutes)

    candles = []
    for i in range(num_candles):
        ts = start_time + timedelta(minutes=i * interval_minutes)
        price = prices[i]
        # Generate OHLC from close price
        noise = abs(np.random.normal(0, volatility * 0.5)) * base_price
        high = price + noise
        low = price - noise
        open_price = prices[i - 1] if i > 0 else price

        candles.append(
            CandleData(
                timestamp=ts,
                open=round(open_price, 3),
                high=round(high, 3),
                low=round(low, 3),
                close=round(price, 3),
                volume=round(np.random.uniform(100, 10000)),
            )
        )

    return candles


def _interval_to_minutes(interval: str) -> int:
    """Convert interval string to minutes."""
    mapping = {"1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240, "1d": 1440}
    return mapping.get(interval, 60)


def _period_to_minutes(period: str) -> int:
    """Convert period string to total minutes."""
    mapping = {"1d": 1440, "5d": 7200, "1mo": 43200, "3mo": 129600, "6mo": 259200, "1y": 525600}
    return mapping.get(period, 7200)
