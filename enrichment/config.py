"""Configuration: env vars, constants, directories, logging."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from mos-health/ root, then fall back to APP/.env for shared keys
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / "APP" / ".env")

# ── Directories ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
PROGRESS_FILE = OUTPUT_DIR / "progress.json"

for d in (DATA_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ── Trigger.dev (api-proxy queue) ────────────────────────────────────────────
TRIGGER_SECRET_KEY = (
    os.getenv("TRIGGER_SECRET_KEY_PROD")
    or os.getenv("TRIGGER_SECRET_KEY_DEV")
    or ""
)
TRIGGER_API_URL = "https://api.trigger.dev"
TRIGGER_POLL_INTERVAL = 2.0  # seconds between polls
TRIGGER_POLL_TIMEOUT = 60  # seconds before giving up on a run

# ── RapidAPI ─────────────────────────────────────────────────────────────────
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv(
    "RAPIDAPI_HOST", "fresh-linkedin-scraper-api.p.rapidapi.com"
)

# ── OpenRouter ───────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
PRIMARY_MODEL = "google/gemini-2.5-flash"
FALLBACK_MODEL = "google/gemini-2.5-flash-lite"

# ── Classifier settings ─────────────────────────────────────────────────────
CLASSIFY_TEMPERATURE = 0.1
CLASSIFY_MAX_TOKENS = 800
CLASSIFY_MAX_RETRIES = 3
CLASSIFY_BACKOFF_BASE = 5  # seconds, doubles on each retry

# ── Posts ────────────────────────────────────────────────────────────────────
MAX_POST_PAGES = 6
MAX_POSTS_PER_PERSON = 60
LOOKBACK_DAYS = 548  # ~18 months

# ── Input CSV ────────────────────────────────────────────────────────────────
USERNAME_COLUMN = "public_identifier"

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
LOG_DATE_FORMAT = "%H:%M:%S"


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
    # Quiet noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
