import hashlib
import hmac
import os


PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 260_000
SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = os.urandom(SALT_BYTES).hex()
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt}${password_hash}"


def looks_like_sha256(value: str | None) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(c in "0123456789abcdef" for c in value.lower())
    )


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False

    if looks_like_sha256(stored_hash):
        legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return hmac.compare_digest(stored_hash, legacy_hash)

    try:
        algorithm, iterations, salt, password_hash = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != PBKDF2_ALGORITHM:
        return False

    try:
        candidate_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        ).hex()
    except ValueError:
        return False

    return hmac.compare_digest(candidate_hash, password_hash)


def needs_rehash(stored_hash: str | None) -> bool:
    if not stored_hash or looks_like_sha256(stored_hash):
        return True

    try:
        algorithm, iterations, _salt, _password_hash = stored_hash.split("$", 3)
        return algorithm != PBKDF2_ALGORITHM or int(iterations) < PBKDF2_ITERATIONS
    except (TypeError, ValueError):
        return True
