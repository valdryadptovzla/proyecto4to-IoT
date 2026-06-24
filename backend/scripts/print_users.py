from backend.database import usuarios_collection


def main():
    for u in usuarios_collection.find():
        uid = u.get("_id")
        username = u.get("username") or u.get("usuario")
        pwd_hash = u.get("password_hash")
        pwd_plain = u.get("password")
        print(f"_id={uid} username={username} password_hash={pwd_hash!r} password={pwd_plain!r}")


if __name__ == "__main__":
    main()
