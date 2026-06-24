from .database import alertas_collection

# Ver todas las alertas
alertas = alertas_collection.find()
for a in alertas:
    print("=== Alerta ===")
    for key, value in a.items():
        print(f"  {key}: {value}")
    print("---")