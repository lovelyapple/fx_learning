"""Core configuration module.

All settings are loaded from environment variables.
No hardcoded paths or magic numbers allowed.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API
    backend_port: int = 8000
    frontend_port: int = 5173
    cors_origins: list[str] = ["http://localhost:5173"]

    # GitHub Models API
    github_token: str = ""
    github_models_endpoint: str = "https://models.github.ai/inference"
    ai_model_name: str = "openai/gpt-4.1"
    ai_max_tokens: int = 2048
    ai_temperature: float = 0.7
    ai_timeout_seconds: int = 30

    # Twelve Data API (live price)
    twelvedata_api_key: str = "demo"

    # FX Data
    default_pair: str = "USDJPY=X"
    allowed_pairs: list[str] = ["USDJPY=X", "EURUSD=X", "GBPJPY=X"]
    candle_intervals: list[str] = ["1m", "5m", "15m", "1h", "4h", "1d"]
    allowed_periods: list[str] = ["1d", "5d", "1mo", "3mo", "6mo", "1y"]
    default_interval: str = "1m"
    default_period: str = "1d"

    # AI Context
    ai_context_candles: int = 80
    max_chat_history: int = 50

    # Prompt file (relative to backend/app/prompts/)
    ai_system_prompt_file: str = "system_prompt.txt"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_prompt_path(self) -> Path:
        """Get the absolute path to the system prompt file."""
        prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
        return prompts_dir / self.ai_system_prompt_file

    def load_system_prompt(self) -> str:
        """Load system prompt from file."""
        prompt_path = self.get_prompt_path()
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8")
        return self._default_system_prompt()

    @staticmethod
    def _default_system_prompt() -> str:
        return (
            "あなたはFXテクニカル分析の専門家です。\n"
            "ユーザーがFXの学習をしています。\n"
            "ドル円（USD/JPY）のチャートデータを基に、テクニカル分析の用語や概念を"
            "分かりやすく説明してください。\n"
            "仮説を立てる場合は、根拠となるテクニカル指標やチャートパターンを示してください。\n"
            "投資助言ではなく、あくまで学習目的であることを必ず伝えてください。\n"
            "「買うべき」「売るべき」といった直接的な投資判断は行わないでください。"
        )

    def validate_pair(self, pair: str) -> str:
        """Validate and return pair, falling back to default."""
        return pair if pair in self.allowed_pairs else self.default_pair

    def validate_interval(self, interval: str) -> str:
        """Validate and return interval, falling back to default."""
        return interval if interval in self.candle_intervals else self.default_interval

    def validate_period(self, period: str) -> str:
        """Validate and return period, falling back to default."""
        return period if period in self.allowed_periods else self.default_period


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    env_path = root_dir / ".env"
    if env_path.exists():
        return Settings(_env_file=str(env_path))
    return Settings()

