# Sistema de Gestion Energetica

Proyecto universitario para monitorear y administrar consumo electrico de dispositivos en oficinas.

## Funcionalidades principales

- Login con JWT firmado y roles de usuario.
- Panel de dashboard con consumo total, dispositivos monitoreados y alertas.
- CRUD de dispositivos para admin.
- Registro y consulta de consumos electricos.
- Alertas automaticas por consumo alto o consumo en dispositivos apagados.
- Auditoria de acciones administrativas.
- Gestion de usuarios para administradores.
- Generacion de reportes PDF.
- Modo offline en la app con cache local y cola de sincronizacion.

## Tecnologias

- Backend: FastAPI, Pydantic, PyMongo, PyJWT, slowapi y MongoDB.
- Frontend: React Native, Expo, React Navigation, Axios y AsyncStorage.
- Base de datos: MongoDB local.

## Usuarios de prueba

La API crea estos usuarios por defecto al iniciar si no existen:

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | `energiadmin` | `Energia@2026!` |
| Operador | `operador` | `Monitor#IoT24` |

Para restablecer los usuarios a estos valores por defecto se puede ejecutar:

```powershell
.\.venv\Scripts\python.exe -m backend.scripts.reset_users
```

## Roles del sistema

El sistema usa solo dos roles:

- `admin`: acceso total. Puede crear, editar, eliminar, administrar usuarios, ver auditoria, configurar modo offline y generar reportes.
- `usuario`: solo visualizacion. Puede consultar dashboard, dispositivos, alertas y reportes permitidos, sin modificar datos.

## Requisitos

- Python 3.11 o superior.
- Node.js.
- MongoDB ejecutandose en `mongodb://localhost:27017`.

## Instalacion del backend

Desde la raiz del proyecto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Si PowerShell bloquea la activacion del entorno virtual, se puede usar:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

## Instalacion del frontend

```powershell
cd frontend
npm install
```

## Ejecucion rapida

Desde la raiz:

```powershell
.\start-dev.ps1
```

El script inicia:

- Backend: `http://localhost:8000`
- Expo: `http://localhost:8081`

Tambien muestra la URL de API que debe usar un telefono en la misma red.

## Ejecucion manual

Backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Frontend:

```powershell
cd frontend
$env:EXPO_PUBLIC_API_URL="http://localhost:8000"
npx expo start --lan --clear
```

Para probar en telefono fisico, usa la IP local de la laptop:

```powershell
$env:EXPO_PUBLIC_API_URL="http://TU-IP-LOCAL:8000"
npx expo start --lan --clear
```

## Variables de entorno utiles

- `MONGO_URL`: URL de MongoDB. Por defecto: `mongodb://localhost:27017`.
- `MONGO_DB_NAME`: nombre de la base de datos. Por defecto: `gestion_energetica`.
- `ALLOWED_ORIGINS`: origenes CORS permitidos. Por defecto: `http://localhost:8081,http://localhost:19006`.
- `ALERT_THRESHOLD_WATTS`: umbral de alerta de consumo. Por defecto: `1000`.
- `EXPO_PUBLIC_API_URL`: URL del backend usada por Expo.
- `TOKEN_SECRET`: secreto para firmar tokens JWT. **Obligatorio cambiar en produccion.**
- `TOKEN_TTL_SECONDS`: duracion de sesion. Por defecto: 8 horas (28800 segundos).

## MongoDB

El backend usa MongoDB mediante PyMongo en `backend/database.py`.

Colecciones principales:

- `usuarios`
- `dispositivos`
- `consumo_energia`
- `alertas`
- `auditoria`

La conexion se configura con `MONGO_URL` y `MONGO_DB_NAME`. Por defecto apunta a MongoDB local en `mongodb://localhost:27017`.

## Modo offline

La app ya tiene soporte offline parcial:

- Guarda localmente usuario/sesion, configuracion, snapshot de dispositivos, consumos y alertas con AsyncStorage.
- Cuando no hay conexion, muestra el ultimo snapshot local.
- Para cambios de dispositivos hechos por admin en modo offline, guarda una cola local.
- Al recuperar conexion, intenta sincronizar la cola con la API.

Limitacion actual: el modo offline esta enfocado en dispositivos. Si se requiere capturar consumos o alertas manuales offline, se debe extender la cola local para esos tipos de datos.

## Seguridad implementada

- Contrasenas hasheadas con PBKDF2-SHA256 (260,000 iteraciones) y sal aleatoria.
- Autenticacion mediante JWT estandar (PyJWT, algoritmo HS256).
- Rate limiting en el endpoint de login: maximo 5 intentos por minuto por IP (slowapi).
- CORS restringido a origenes conocidos (configurable via `.env`).
- Roles validados desde el token en cada peticion al backend.
- Sin bypass de autenticacion por headers HTTP.

## Verificaciones

Frontend:

```powershell
cd frontend
npm run typecheck
```

Backend:

```powershell
.\.venv\Scripts\python.exe -m compileall backend
```
