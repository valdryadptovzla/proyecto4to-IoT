from .database import consumo_collection

# Ver todos los consumos
consumos = consumo_collection.find()
for c in consumos:
    print("=== Consumo ===")
    for key, value in c.items():
        print(f"  {key}: {value}")
    print("---")