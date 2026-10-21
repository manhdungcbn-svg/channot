"""
Configuration - Load environment variables
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded env from: {env_path}")

# Config
class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./warranty.db")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    AI_MODE = os.getenv("AI_MODE", "gemini")
    
    # CORS
    BACKEND_CORS_ORIGINS = os.getenv(
        "BACKEND_CORS_ORIGINS", 
        '["http://localhost", "http://localhost:5173"]'
    )

settings = Settings()
