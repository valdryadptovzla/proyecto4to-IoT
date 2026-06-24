from backend.database import usuarios_collection
from backend.services.password_service import hash_password

new_hash = hash_password("admin")
res = usuarios_collection.update_one(
    {"_id": "admin"},
    {"$set": {"password_hash": new_hash}, "$unset": {"password": ""}},
)
print('matched', res.matched_count, 'modified', res.modified_count)
