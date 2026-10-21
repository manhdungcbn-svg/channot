"""S3 fix — model bảng login_attempts để chống brute-force."""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base
from app.core.datetime_utils import utcnow


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    last_attempt_at = Column(DateTime, default=utcnow)

    def is_locked(self) -> bool:
        if self.locked_until is None:
            return False
        # So sánh với UTC hiện tại
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        return self.locked_until > now

    def remaining_seconds(self) -> int:
        if not self.is_locked():
            return 0
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        return int((self.locked_until - now).total_seconds())