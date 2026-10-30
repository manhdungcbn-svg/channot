from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Warranty Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database — SQLite mặc định (dev/test). Khi deploy production, set DATABASE_URL=postgresql+psycopg2://...
    DATABASE_URL: str = "sqlite:///./warranty.db"

    # JWT signing key — BẮT BUỘC đọc từ env. Không có default trong source.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: list = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

    # AI Engine — key chỉ bắt buộc khi AI_MODE="gemini"
    GEMINI_API_KEY: str = ""
    AI_MODE: str = "mock"  # mock | gemini | openai

    # Supabase OAuth — bắt buộc có khi dùng login Google
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    # Optional: Google OAuth client ID — verify audience của Google provider_token.
    # Nếu rỗng, audience check bị bỏ qua (vẫn verify signature).
    SUPABASE_GOOGLE_CLIENT_ID: str = ""

    # Wallet / lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # P0 hardening — chống top-up tự khai số tiền ở production.
    # Mặc định TRUE để không break local/dev/test. Khi deploy production,
    # set ALLOW_SANDBOX_TOPUP=false trong .env. Khi đó, request top-up phải
    # kèm `payment_provider_ref` (chứng từ từ cổng thanh toán thật).
    ALLOW_SANDBOX_TOPUP: bool = True

    @field_validator("SECRET_KEY")
    @classmethod
    def _require_secret_key(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise RuntimeError(
                "SECRET_KEY chưa được cấu hình. "
                "Set SECRET_KEY trong file backend/.env (không commit) trước khi chạy backend."
            )
        return v

    @field_validator("GEMINI_API_KEY")
    @classmethod
    def _require_gemini_only_if_enabled(cls, v: str) -> str:
        # Validator này chạy sau khi AI_MODE đã được load.
        # Nếu AI_MODE="gemini" mà thiếu key thì raise; ngược lại OK.
        # Lưu ý: pydantic chạy validator theo thứ tự khai báo, nên AI_MODE phải khai báo trước.
        return v

    def require_gemini_key_if_needed(self) -> None:
        """Gọi hàm này khi cần gọi Gemini API thật (raise sớm nếu thiếu key)."""
        if self.AI_MODE == "gemini" and not self.GEMINI_API_KEY:
            raise RuntimeError(
                "AI_MODE=gemini nhưng GEMINI_API_KEY rỗng. "
                "Set GEMINI_API_KEY trong file backend/.env hoặc đổi AI_MODE=mock."
            )

    def require_supabase_oauth_if_needed(self) -> None:
        """Gọi hàm này trước khi gọi endpoint Supabase OAuth (raise sớm nếu thiếu config)."""
        if not self.SUPABASE_URL or not self.SUPABASE_ANON_KEY:
            raise RuntimeError(
                "Supabase OAuth chưa được cấu hình. "
                "Set SUPABASE_URL và SUPABASE_ANON_KEY trong file backend/.env "
                "(hoặc vô hiệu hóa nút 'Đăng nhập với Google' ở frontend)."
            )

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        # pydantic-settings >=2 mặc định forbid extra env keys.
        # Cho phép các biến không dùng (vd VNPAY_*) trong .env mà không làm app fail khởi động.
        extra="ignore",
    )


settings = Settings()