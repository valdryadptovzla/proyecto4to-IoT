import sys
import traceback

try:
    from .database import (
        alertas_collection,
        auditoria_collection,
        consumo_collection,
        db,
        dispositivos_collection,
        usuarios_collection,
    )
except Exception:
    print(
        "Error: no se pudo importar el modulo 'database'. "
        "Ejecuta este script desde la carpeta del proyecto y activa el entorno virtual."
    )
    traceback.print_exc()
    sys.exit(2)


def print_coll_info(name, collection) -> None:
    try:
        count = collection.count_documents({})
    except Exception as error:
        print(f"- {name}: error al contar documentos: {error}")
        return

    print(f"- {name}: {count} documentos")
    try:
        document = collection.find_one()
        if document:
            from bson import json_util

            print(f"  Ejemplo: {json_util.dumps(document, indent=2)}")
        else:
            print("  Ejemplo: <sin documentos>")
    except Exception as error:
        print(f"  No se pudo recuperar ejemplo: {error}")


def main() -> None:
    print("Conectando a MongoDB desde backend/database.py")
    try:
        print("DB name:", db.name)
    except Exception as error:
        print("Error al acceder a la BD:", error)
        traceback.print_exc()
        sys.exit(3)

    try:
        collections = db.list_collection_names()
        print("Colecciones en la BD:", collections)
    except Exception as error:
        print("Error listando colecciones:", error)
        traceback.print_exc()

    print("\nInformacion por coleccion:")
    print_coll_info("usuarios", usuarios_collection)
    print_coll_info("dispositivos", dispositivos_collection)
    print_coll_info("consumo_energia", consumo_collection)
    print_coll_info("alertas", alertas_collection)
    print_coll_info("auditoria", auditoria_collection)

    print("\nVerificacion completada.")


if __name__ == "__main__":
    main()
