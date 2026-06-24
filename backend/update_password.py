from .database import usuarios_collection
from .services.password_service import hash_password


new_hash = hash_password("admin")
result = usuarios_collection.update_one(
    {"$or": [{"_id": "admin"}, {"username": "admin"}, {"usuario": "admin"}]},
    {"$set": {"password_hash": new_hash}, "$unset": {"password": ""}},
)

print(f"Usuario actualizado: {result.modified_count}")

user = usuarios_collection.find_one(
    {"$or": [{"_id": "admin"}, {"username": "admin"}, {"usuario": "admin"}]}
)
print(f"Nuevo password_hash: {user.get('password_hash') if user else 'admin no encontrado'}")
