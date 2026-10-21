"""Pytest config — set env đầu tiên, trước khi bất kỳ Settings nào được load."""
import os

# PHẢI set trước khi app.core.config được import
os.environ.setdefault("SECRET_KEY", "test_secret_for_pytest_only")
os.environ.setdefault("SUPABASE_URL", "https://testproject.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test_anon_key_for_pytest_only")
os.environ.setdefault("AI_MODE", "mock")

# Ép SQLite để test chạy được khi .env trỏ về Supabase
os.environ["DATABASE_URL"] = "sqlite:///./warranty_test.db"


def pytest_configure(config):
    pass