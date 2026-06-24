"""Reset the usuarios collection to only contain the two default users
with secure credentials.

Run from the project root:
    .venv\Scripts\python.exe -m backend.scripts.reset_users
"""
import os
import sys

# Ensure the project root is on sys.path so the backend package is importable.
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.database import usuarios_collection
from backend.services.password_service import hash_password


def main() -> None:
    # Remove ALL existing users
    result = usuarios_collection.delete_many({})
    print(f"Usuarios eliminados: {result.deleted_count}")

    # Insert the two new default users with secure credentials
    default_users = [
        {
            "_id": "admin",
            "username": "energiadmin",
            "password_hash": hash_password("Energia@2026!"),
            "nombre_completo": "Administrador del Sistema",
            "rol": "admin",
        },
        {
            "_id": "usuario-demo",
            "username": "operador",
            "password_hash": hash_password("Monitor#IoT24"),
            "nombre_completo": "Operador de Monitoreo",
            "rol": "usuario",
        },
    ]

    for user in default_users:
        usuarios_collection.insert_one(user)
        print(f"  Creado: {user['username']} ({user['rol']})")

    print()
    print("=" * 50)
    print("  NUEVAS CREDENCIALES")
    print("=" * 50)
    print("  Admin:    energiadmin / Energia@2026!")
    print("  Usuario:  operador    / Monitor#IoT24")
    print("=" * 50)


if __name__ == "__main__":
    main()
