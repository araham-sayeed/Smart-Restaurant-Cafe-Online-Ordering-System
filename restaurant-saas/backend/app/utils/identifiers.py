import re

def normalize_phone(raw: str) -> str:
    return re.sub(r"\D", "", raw.strip())

def is_email(value: str) -> bool:
    return "@" in value.strip()

def normalize_identifier(value: str) -> tuple[str, str]:
    """Returns ('email', normalized) or ('phone', normalized)."""
    v = value.strip()
    if is_email(v):
        return "email", v.lower()
    return "phone", normalize_phone(v)
