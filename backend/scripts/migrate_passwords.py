from ..database import usuarios_collection
from ..services.password_service import hash_password, looks_like_sha256, needs_rehash


def main() -> None:
    updated = 0
    for user in usuarios_collection.find():
        uid = user.get("_id")
        stored_hash = user.get("password_hash")

        plaintext = user.get("password")
        if not plaintext and stored_hash and needs_rehash(stored_hash) and not looks_like_sha256(stored_hash):
            plaintext = stored_hash

        if not plaintext:
            continue

        if needs_rehash(stored_hash):
            usuarios_collection.update_one(
                {"_id": uid},
                {
                    "$set": {"password_hash": hash_password(plaintext)},
                    "$unset": {"password": ""},
                },
            )
            updated += 1

    print(f"Password migration complete. Users updated: {updated}")


if __name__ == "__main__":
    main()
