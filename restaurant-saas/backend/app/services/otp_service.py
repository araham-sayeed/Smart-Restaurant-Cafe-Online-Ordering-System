import random
import time
from app.core.config import settings
from app.core.redis_client import get_redis

# Fallback when Redis is unavailable (local tests without Redis).
_memory: dict[str, tuple[str, float]] = {}

OTP_TTL_SECONDS = 300

def _key(purpose: str, identifier: str) -> str:
    return f"otp:{purpose}:{identifier}"

def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"

def store_otp(purpose: str, identifier: str, code: str) -> None:
    key = _key(purpose, identifier)
    try:
        get_redis().setex(key, OTP_TTL_SECONDS, code)
    except Exception:
        _memory[key] = (code, time.time() + OTP_TTL_SECONDS)

def verify_otp(purpose: str, identifier: str, code: str) -> bool:
    if not settings.OTP_REQUIRED:
        return True
    if not code or not code.strip():
        return False
    key = _key(purpose, identifier)
    expected = None
    try:
        expected = get_redis().get(key)
        if expected and expected == code.strip():
            get_redis().delete(key)
            return True
    except Exception:
        pass
    entry = _memory.get(key)
    if entry and entry[1] >= time.time() and entry[0] == code.strip():
        del _memory[key]
        return True
    return False

def issue_otp(purpose: str, identifier: str) -> str:
    code = generate_otp()
    store_otp(purpose, identifier, code)
    return code
