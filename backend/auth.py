"""
Authentication helpers.

This file prefers Argon2 (argon2-cffi via passlib) to avoid bcrypt's 72-byte limit
and compatibility issues in some environments. If Argon2 isn't available it falls
back to a SHA-256 pre-hash + passlib bcrypt CryptContext.
"""

from jose import jwt
from datetime import datetime, timedelta
import hashlib

# Try to use Argon2 via passlib first (recommended)
try:
    from passlib.hash import argon2
    _HAS_ARGON2 = True
except Exception:
    _HAS_ARGON2 = False

from passlib.context import CryptContext

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

# bcrypt context as fallback
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _pre_hash_sha256_hex(password: str) -> str:
    """Return SHA-256 hex digest of the password.

    Using a fixed-length hex digest avoids bcrypt's 72-byte limit when using
    the bcrypt backend.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using Argon2 if available, otherwise bcrypt with pre-hash."""
    if _HAS_ARGON2:
        # argon2 accepts arbitrary-length input and is more robust.
        return argon2.hash(password)

    # fallback: pre-hash to hex then bcrypt
    pre = _pre_hash_sha256_hex(password)
    return _pwd_context.hash(pre)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password. Works with Argon2 or bcrypt fallback."""
    if _HAS_ARGON2:
        try:
            return argon2.verify(plain, hashed)
        except Exception:
            return False

    pre = _pre_hash_sha256_hex(plain)
    try:
        return _pwd_context.verify(pre, hashed)
    except Exception:
        return False


def create_token(data: dict, expires_minutes=60):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)