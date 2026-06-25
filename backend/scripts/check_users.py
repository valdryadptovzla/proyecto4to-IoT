from .database import usuarios_collection

# Ver todos los usuarios
usuarios = usuarios_collection.find()
for u in usuarios:
    print("=== Usuario ===")
    for key, value in u.items():
        print(f"  {key}: {value}")
    print("---")