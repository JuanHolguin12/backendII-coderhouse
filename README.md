# Plataforma de Eventos e Inscripciones

Proyecto final de **Backend II (Coderhouse)**: API REST para la gestión de eventos e inscripciones.

El proyecto es un servidor Express organizado por capas (rutas, controladores, servicios, repositorios, DAO, modelos y configuración), listo para escalar en las próximas entregas con roles, gestión de eventos, inscripciones y notificaciones.

Esta pre-entrega (4) refactoriza la autenticación para centralizarla con **Passport.js**: el contrato externo de la API (rutas y respuestas) no cambia respecto de la Pre-entrega 3, pero ahora la lógica de registro, login y usuario actual vive en estrategias de Passport en lugar de estar mezclada en servicios/middlewares ad-hoc.

## Temática

Plataforma de Eventos e Inscripciones: permite a los usuarios explorar eventos, registrarse/loguearse e inscribirse, y a los organizadores gestionar sus eventos y cupos.

## Tecnologías

- Node.js
- Express
- MongoDB + Mongoose
- Passport.js (`passport`, `passport-local`) — estrategias de autenticación centralizadas
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT)
- cookie-parser (lectura de cookies)
- dotenv
- Módulos ESM (import/export)

## Instalación

```bash
git clone https://github.com/JuanHolguin12/backendII-coderhouse.git
cd backendII-coderhouse/coderhouse
npm install
```

## Configuración de variables de entorno

1. Copiar el archivo `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

2. Completar las variables:

   | Variable        | Descripción                                              |
   | --------------- | --------------------------------------------------------- |
   | PORT            | Puerto donde se levanta el servidor                       |
   | NODE_ENV        | Entorno de ejecución (development/production)             |
   | MONGO_URL       | URL de conexión a MongoDB                                 |
   | JWT_SECRET      | Secreto para firmar tokens JWT                             |
   | JWT_EXPIRES_IN  | Expiración del JWT (ej. `1h`)                              |

## Cómo ejecutar

> Necesitás una instancia de MongoDB corriendo (local o Atlas) y accesible desde `MONGO_URL`. El servidor no levanta si no logra conectarse a la base de datos.

```bash
npm start
```

o en modo desarrollo (con recarga automática):

```bash
npm run dev
```

El servidor quedará disponible en `http://localhost:<PORT>`.

## Estructura de carpetas

```
src/
├── app.js                     # configura Express + passport.initialize() (no levanta el server)
├── server.js                  # levanta el servidor
├── config/
│   ├── config.js               # variables de entorno
│   ├── db.js                   # conexión a MongoDB
│   └── passport.config.js      # estrategias 'register', 'login' y 'current' centralizadas
├── routes/                     # definición de rutas por recurso (delegan en passport.authenticate)
├── controllers/                # manejo de request/response (genera el JWT y setea la cookie)
├── services/                   # lógica de negocio (eventos; la de sesiones vive en las estrategias)
├── repositories/                # abstracción de acceso a datos
├── dao/                         # acceso directo a la base de datos
├── models/                       # modelos de datos (User, Event)
└── utils/                        # utilidades varias (jwt, hash, errores)
```

## Rutas disponibles

| Método | Ruta                     | Descripción                                                    |
| ------ | ------------------------ | ---------------------------------------------------------------- |
| GET    | /api/health               | Verifica que el servidor está activo                            |
| GET    | /api/events                | Lista de eventos (vacía por el momento)                         |
| POST   | /api/sessions/register     | Registra un usuario nuevo                                       |
| POST   | /api/sessions/login        | Inicia sesión y setea la cookie `currentUser` (JWT, HttpOnly)   |
| GET    | /api/sessions/current      | Devuelve el usuario autenticado (requiere cookie válida)        |
| POST   | /api/sessions/logout       | Cierra sesión eliminando la cookie `currentUser`                |

## Autenticación con Passport.js

La autenticación está centralizada en `src/config/passport.config.js`. `app.js` sólo inicializa Passport (`passport.initialize()`); ni las rutas ni `app.js` conocen la lógica interna de cada estrategia.

| Estrategia | Tipo                          | Usada en                    | Qué hace                                                                                          |
| ---------- | ----------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `register` | `passport-local`               | `POST /api/sessions/register` | Valida campos, normaliza el email, verifica unicidad, hashea la contraseña (bcrypt) y crea el usuario con rol `user` por defecto |
| `login`    | `passport-local`               | `POST /api/sessions/login`    | Busca el usuario por email y compara la contraseña con bcrypt; nunca revela cuál de los dos datos falló |
| `current`  | Estrategia custom (`passport.Strategy`) | `GET /api/sessions/current`   | Lee el JWT desde la cookie `currentUser`, lo verifica y deja `{ id, email, role }` en `req.user`   |

Puntos importantes de la implementación:

- Las estrategias **no generan el JWT ni setean cookies**: sólo autentican y devuelven el usuario (o `false` + motivo de rechazo) a través de `done(...)`. Esa responsabilidad queda en `sessions.controller.js`.
- Las rutas de `sessions.router.js` delegan siempre en `passport.authenticate('register' | 'login' | 'current', { session: false }, callback)`; el `callback` sólo traduce el resultado de Passport a los códigos de estado y mensajes ya definidos por el contrato (400/401/409), sin agregar lógica de negocio.
- `POST /api/sessions/logout` no pasa por Passport: sólo limpia la cookie.
- **Preparado para providers externos**: para sumar Google, GitHub, etc. sólo hay que registrar una nueva estrategia con `passport.use('google', new GoogleStrategy(...))` dentro de `initPassport()` en `passport.config.js` — no hace falta tocar `app.js` ni las rutas existentes.

## Registro de usuarios — POST /api/sessions/register

Crea un usuario nuevo. El campo `role` **no** se puede enviar en el body: siempre se asigna `user` por defecto (los roles `organizer`/`admin` se asignarán en próximas entregas mediante lógica interna).

### Body esperado

| Campo        | Tipo   | Obligatorio | Validación                          |
| ------------ | ------ | ----------- | ------------------------------------ |
| `first_name` | string | sí          | presencia                            |
| `last_name`  | string | sí          | presencia                            |
| `email`      | string | sí          | formato válido; se normaliza (trim + lowercase) antes de guardar |
| `password`   | string | sí          | mínimo 8 caracteres; se guarda hasheada con bcrypt, nunca en texto plano |

### Ejemplo de request

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "Ana@Mail.com ",
    "password": "Secreta123"
  }'
```

### Respuestas posibles

**201 — Registro exitoso** (email normalizado, sin `password`):

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

**400 — Campos faltantes, email inválido o password corta:**

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

**409 — Email ya registrado:**

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### Casos a probar

1. Registro exitoso con datos válidos → `201`
2. Registro con campos faltantes → `400`
3. Registro con email en formato inválido → `400`
4. Registro con password de menos de 8 caracteres → `400`
5. Registro con un email ya existente → `409`
6. Verificar en MongoDB que el campo `password` está hasheado (no en texto plano):
   ```bash
   mongosh "mongodb://localhost:27017/plataforma-eventos" --eval 'db.users.findOne({ email: "ana@mail.com" })'
   ```
7. Verificar que la respuesta del endpoint nunca incluye el campo `password`

## Login — POST /api/sessions/login

Valida credenciales, y si son correctas genera un JWT (payload `{ id, email, role }`, firmado con `JWT_SECRET`, expiración `JWT_EXPIRES_IN`) y lo guarda en la cookie `currentUser` (`httpOnly`, `sameSite: 'lax'`, `maxAge: 3600000`, `secure: true` solo en producción). Si el email no existe o la contraseña no coincide, responde siempre el mismo mensaje genérico, sin indicar cuál de los dos falló.

### Body esperado

| Campo      | Tipo   | Obligatorio |
| ---------- | ------ | ----------- |
| `email`    | string | sí          |
| `password` | string | sí          |

### Ejemplo de request

```bash
curl -i -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ana@mail.com", "password": "Secreta123" }'
```

### Respuestas posibles

**200 — Login correcto** (además setea la cookie `currentUser`, HttpOnly):

```json
{ "status": "success", "message": "Login correcto" }
```

**401 — Credenciales incorrectas** (mismo mensaje si el email no existe o si la contraseña no coincide):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

## Usuario autenticado — GET /api/sessions/current

Ruta protegida por la estrategia `current` de Passport (`src/config/passport.config.js`), usada como middleware vía `passport.authenticate('current', { session: false }, ...)`. Lee la cookie `currentUser`, verifica el JWT y deja `{ id, email, role }` en `req.user` (sin `password`).

### Ejemplo de request

```bash
curl -b "currentUser=<token>" http://localhost:8080/api/sessions/current
```

### Respuestas posibles

**200 — Usuario autenticado:**

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

**401 — Sin cookie, token inválido o expirado:**

```json
{ "status": "error", "message": "No autenticado" }
```

## Logout — POST /api/sessions/logout

Elimina la cookie `currentUser`, cerrando la sesión.

### Ejemplo de request

```bash
curl -b "currentUser=<token>" -X POST http://localhost:8080/api/sessions/logout
```

### Respuesta

**200:**

```json
{ "status": "success", "message": "Sesión cerrada" }
```

### Casos a probar (login / current / logout)

1. Registro exitoso → login → `/current` → logout → `/current` devuelve `401`
2. Login con email inexistente → `401` (mensaje genérico)
3. Login con contraseña incorrecta → `401` (mismo mensaje genérico)
4. `/current` sin cookie → `401`
5. `/current` con token manipulado o expirado → `401`

## Próximas entregas

- Autenticación con providers externos (Google, GitHub, etc.) como nuevas estrategias en `passport.config.js`
- Roles y autorización
- Gestión completa de eventos
- Inscripciones y control de cupos
- Notificaciones
