import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


def _env(primary: str, fallback: str = "", default: str = "") -> str:
    return os.getenv(primary) or (os.getenv(fallback) if fallback else "") or default


class Config:
    SECRET_KEY = _env("SECRET_KEY", default="drishyamitra-secret-key")
    JWT_SECRET_KEY = _env("JWT_SECRET_KEY", default=SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(_env("JWT_EXPIRES_HOURS", default="12")))

    SQLALCHEMY_DATABASE_URI = _env("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'drishyamitra.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = _env("UPLOAD_FOLDER", default=str(BASE_DIR / "uploads"))
    MAX_CONTENT_LENGTH = int(_env("MAX_CONTENT_LENGTH", "MAX_FILE_SIZE", str(16 * 1024 * 1024)))

    GROQ_API_KEY = _env("GROQ_API_KEY")
    GROQ_MODEL = _env("GROQ_MODEL", default="llama-3.1-8b-instant")

    # Supports both MAIL_* and SMTP_/SENDER_* env styles
    MAIL_SERVER = _env("MAIL_SERVER", "SMTP_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(_env("MAIL_PORT", "SMTP_PORT", "587"))
    MAIL_USE_TLS = _env("MAIL_USE_TLS", "SMTP_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = _env("MAIL_USERNAME", "SENDER_EMAIL")
    MAIL_PASSWORD = _env("MAIL_PASSWORD", "SENDER_PASSWORD")
    MAIL_FROM = _env("MAIL_FROM", "SENDER_EMAIL", MAIL_USERNAME)

    WHATSAPP_API_URL = _env("WHATSAPP_API_URL")
    WHATSAPP_TOKEN = _env("WHATSAPP_TOKEN")
