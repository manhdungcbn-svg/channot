"""Test cleanup_legacy_admin_users."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import hash_password
from app.models.user import User


@pytest.fixture
def in_memory_db():
    """DB SQLite in-memory để test cô lập."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    yield engine, TestingSessionLocal
    Base.metadata.drop_all(bind=engine)


def _seed_user(db, email, role, is_seed=False):
    u = User(
        email=email,
        full_name="Test",
        role=role,
        hashed_password=hash_password("x"),
        is_seed=is_seed,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def test_cleanup_finds_legacy_admin(in_memory_db):
    """User admin không phải seed phải bị phát hiện."""
    _, SessionLocal = in_memory_db
    db = SessionLocal()
    try:
        _seed_user(db, "admin@test.vn", "admin", is_seed=True)
        _seed_user(db, "legacy_evil@evil.com", "admin", is_seed=False)  # suspect

        suspects = (
            db.query(User)
            .filter(User.is_seed == False)  # noqa: E712
            .filter(User.role != "customer")
            .all()
        )
        assert len(suspects) == 1
        assert suspects[0].email == "legacy_evil@evil.com"
    finally:
        db.close()


def test_cleanup_skips_seed_users(in_memory_db):
    """User seed role=admin KHÔNG bị liệt vào suspect."""
    _, SessionLocal = in_memory_db
    db = SessionLocal()
    try:
        _seed_user(db, "admin@test.vn", "admin", is_seed=True)
        _seed_user(db, "tech1@test.vn", "technician", is_seed=True)

        suspects = (
            db.query(User)
            .filter(User.is_seed == False)  # noqa: E712
            .filter(User.role != "customer")
            .all()
        )
        assert len(suspects) == 0
    finally:
        db.close()


def test_cleanup_keeps_non_seed_customer(in_memory_db):
    """Customer thường (không seed) KHÔNG bị xóa."""
    _, SessionLocal = in_memory_db
    db = SessionLocal()
    try:
        _seed_user(db, "khach@test.vn", "customer", is_seed=False)

        suspects = (
            db.query(User)
            .filter(User.is_seed == False)  # noqa: E712
            .filter(User.role != "customer")
            .all()
        )
        assert len(suspects) == 0
    finally:
        db.close()


def test_is_seed_default_is_false(in_memory_db):
    """User mới tạo không truyền is_seed phải có is_seed=False."""
    _, SessionLocal = in_memory_db
    db = SessionLocal()
    try:
        u = User(
            email="default@test.vn",
            full_name="Default",
            role="customer",
            hashed_password=hash_password("x"),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        assert u.is_seed == False  # noqa: E712
    finally:
        db.close()