# Plataforma de Eventos e Inscripciones

Proyecto final de **Backend II (Coderhouse)**: API REST para la gestión de eventos e inscripciones.

El proyecto es un servidor Express organizado por capas (rutas, controladores, servicios, repositorios, DAO, modelos y configuración), listo para escalar en las próximas entregas con inscripciones y notificaciones.

La Pre-entrega 4 refactorizó la autenticación para centralizarla con **Passport.js**: el contrato externo de la API (rutas y respuestas) no cambia respecto de la Pre-entrega 3, pero la lógica de registro, login y usuario actual vive en estrategias de Passport en lugar de estar mezclada en servicios/middlewares ad-hoc.

La Pre-entrega 5 suma un sistema de **autorización por roles** (`user`, `organizer`, `admin`): middlewares reutilizables de autenticación y autorización, una matriz de permisos, rutas de eventos protegidas con validación de propiedad del recurso, y una ruta administrativa.

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
├── middlewares/
│   ├── auth.middleware.js      # autenticación (ejecuta la estrategia 'current') → 401 si no hay sesión
│   └── authorize.middleware.js # autorización por rol → 403 si el rol no coincide
├── routes/                     # definición de rutas por recurso (delegan en passport.authenticate/auth/authorize)
├── controllers/                # manejo de request/response (genera el JWT y setea la cookie)
├── services/                   # lógica de negocio (eventos, usuarios; la de sesiones vive en las estrategias)
├── repositories/                # abstracción de acceso a datos
├── dao/                         # acceso directo a la base de datos
├── models/                       # modelos de datos (User, Event)
└── utils/                        # utilidades varias (jwt, hash, errores, sanitizeUser)
```

## Rutas disponibles

| Método | Ruta                     | Descripción                                                    | Protección |
| ------ | ------------------------ | ---------------------------------------------------------------- | ---------- |
| GET    | /api/health               | Verifica que el servidor está activo                            | Pública |
| GET    | /api/events                | Lista los eventos publicados                                    | Pública |
| GET    | /api/events/:id             | Detalle de un evento                                            | Pública |
| POST   | /api/events                 | Crea un evento (queda asociado al usuario autenticado)          | `organizer`, `admin` |
| PUT    | /api/events/:id              | Modifica un evento propio (`admin` puede modificar cualquiera)  | `organizer`, `admin` + dueño |
| DELETE | /api/events/:id               | Cancela un evento propio (`admin` puede cancelar cualquiera)   | `organizer`, `admin` + dueño |
| POST   | /api/sessions/register     | Registra un usuario nuevo (siempre con rol `user`)               | Pública |
| POST   | /api/sessions/login        | Inicia sesión y setea la cookie `currentUser` (JWT, HttpOnly)   | Pública |
| GET    | /api/sessions/current      | Devuelve el usuario autenticado (requiere cookie válida)        | Cualquier rol autenticado |
| POST   | /api/sessions/logout       | Cierra sesión eliminando la cookie `currentUser`                | Pública |
| GET    | /api/users                  | Lista todos los usuarios registrados                            | `admin` |

## Autenticación con Passport.js

La autenticación está centralizada en `src/config/passport.config.js`. `app.js` sólo inicializa Passport (`passport.initialize()`); ni las rutas ni `app.js` conocen la lógica interna de cada estrategia.

| Estrategia | Tipo                          | Usada en                    | Qué hace                                                                                          |
| ---------- | ----------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `register` | `passport-local`               | `POST /api/sessions/register` | Valida campos, normaliza el email, verifica unicidad, hashea la contraseña (bcrypt) y crea el usuario con rol `user` por defecto |
| `login`    | `passport-local`               | `POST /api/sessions/login`    | Busca el usuario por email y compara la contraseña con bcrypt; nunca revela cuál de los dos datos falló |
| `current`  | Estrategia custom (`passport.Strategy`) | `GET /api/sessions/current`   | Lee el JWT desde la cookie `currentUser`, lo verifica y deja `{ id, email, role }` en `req.user`   |

Puntos importantes de la implementación:

- Las estrategias **no generan el JWT ni setean cookies**: sólo autentican y devuelven el usuario (o `false` + motivo de rechazo) a través de `done(...)`. Esa responsabilidad queda en `sessions.controller.js`.
- `register` y `login` se invocan en `sessions.router.js` vía `passport.authenticate('register' | 'login', { session: false }, callback)`; el `callback` sólo traduce el resultado de Passport a los códigos de estado y mensajes ya definidos por el contrato (400/401/409), sin agregar lógica de negocio. `current` se reutiliza a través del middleware `auth` (ver [Roles y autorización](#roles-y-autorización)), que se comparte con las rutas de eventos y usuarios.
- `POST /api/sessions/logout` no pasa por Passport: sólo limpia la cookie.
- **Preparado para providers externos**: para sumar Google, GitHub, etc. sólo hay que registrar una nueva estrategia con `passport.use('google', new GoogleStrategy(...))` dentro de `initPassport()` en `passport.config.js` — no hace falta tocar `app.js` ni las rutas existentes.

## Roles y autorización

El modelo `User` (`src/models/User.js`) tiene un campo `role` con valores posibles `user`, `organizer` y `admin`, con `user` como valor por defecto. `POST /api/sessions/register` **ignora cualquier `role` enviado en el body**: la estrategia `register` de Passport sólo toma `first_name`, `last_name`, `email` y `password`, así que un usuario público nunca puede autoasignarse `organizer` o `admin` (esos roles sólo se otorgan cambiando el campo directamente en la base de datos, por un administrador).

### Matriz de permisos

| Acción                          | `user` | `organizer` | `admin` |
| -------------------------------- | :----: | :---------: | :-----: |
| Consultar eventos publicados      |   ✅   |     ✅      |   ✅    |
| Crear eventos                     |   ❌   |     ✅      |   ✅    |
| Modificar/cancelar eventos propios |   ❌   |     ✅      |   ✅    |
| Modificar/cancelar cualquier evento |   ❌   |     ❌      |   ✅    |
| Ver todos los usuarios             |   ❌   |     ❌      |   ✅    |

### Middlewares reutilizables

| Middleware                                  | Responsabilidad                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `auth` (`src/middlewares/auth.middleware.js`)   | Autenticación. Ejecuta la estrategia `current` de Passport: lee el JWT de la cookie `currentUser`, lo valida y puebla `req.user`. Si no hay sesión válida, responde **401**. |
| `authorize(...roles)` (`src/middlewares/authorize.middleware.js`) | Autorización. Recibe la lista de roles permitidos y la compara contra `req.user.role`. Si el rol no está en la lista, responde **403**. Debe ir siempre después de `auth`. |

Ambos son funciones genéricas sin lógica de negocio embebida: las rutas los componen (`auth, authorize("organizer", "admin"), controller`) en vez de repetir `if (req.user.role !== ...)` en cada handler.

### 401 vs 403 — la diferencia

- **401 (No autenticado)**: no hay cookie, el token es inválido/expiró, o fue manipulado. Lo devuelve el middleware `auth` antes de llegar a `authorize`.
- **403 (Sin permisos)**: hay una sesión válida (`req.user` existe), pero el rol no alcanza para la acción (`authorize`), o el usuario no es dueño del recurso que intenta modificar (validado en `events.service.js`).

Ninguno de los dos casos responde 500: los errores de autenticación/autorización siempre devuelven su código específico.

### Propiedad de recursos (eventos)

`POST /api/events` asocia el evento al usuario autenticado (`organizer: req.user.id`). En `PUT /api/events/:id` y `DELETE /api/events/:id`, `events.service.js` compara `event.organizer` contra `req.user.id`:

- Si el usuario es `admin`, puede modificar o cancelar cualquier evento.
- Si es `organizer` y **no** es el dueño del evento, la operación responde `403` con el mensaje `"No podés modificar un evento que no te pertenece"` (o `"...cancelar..."`).
- `authorize("organizer", "admin")` ya filtró antes a los `user`, que ni siquiera llegan a esta validación (quedan en 403 por rol).

## Registro de usuarios — POST /api/sessions/register

Crea un usuario nuevo. El campo `role` **no** se puede enviar en el body: siempre se asigna `user` por defecto. Los roles `organizer`/`admin` se asignan manualmente en la base de datos (no hay endpoint público de escalamiento de privilegios).

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

Ruta protegida por el middleware reutilizable `auth` (`src/middlewares/auth.middleware.js`), que ejecuta la estrategia `current` de Passport (`src/config/passport.config.js`). Lee la cookie `currentUser`, verifica el JWT y deja `{ id, email, role }` en `req.user` (sin `password`).

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

## Eventos — POST/PUT/DELETE /api/events

`GET /api/events` y `GET /api/events/:id` son públicas. Crear, modificar y cancelar requieren sesión (`auth`) y rol `organizer` o `admin` (`authorize("organizer", "admin")`); además, modificar/cancelar valida propiedad del recurso (ver [Roles y autorización](#roles-y-autorización)).

### POST /api/events con rol `user` → 403 (autenticado pero sin permiso)

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### POST /api/events con rol `organizer` o `admin` → 201

```json
{
  "status": "success",
  "payload": {
    "id": "6690...",
    "title": "Congreso Tech 2026",
    "description": "...",
    "date": "2026-08-01T00:00:00.000Z",
    "location": "CABA",
    "capacity": 100,
    "organizer": "665f2a...",
    "status": "published"
  }
}
```

### Ruta privada sin cookie (cualquiera de las anteriores) → 401

```json
{ "status": "error", "message": "No autenticado" }
```

### PUT /api/events/:id — `organizer` sobre un evento ajeno → 403

```json
{ "status": "error", "message": "No podés modificar un evento que no te pertenece" }
```

### GET /api/users — ruta administrativa

Sólo `admin`. Devuelve todos los usuarios registrados, sin el campo `password`.

**403** si el rol autenticado no es `admin`:

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### Casos a probar (roles y autorización)

1. `POST /api/events` con rol `user` → `403`
2. `POST /api/events` con rol `organizer` → éxito (`201`)
3. `GET /api/users` con rol `organizer` → `403`
4. `GET /api/users` con rol `admin` → éxito (`200`)
5. Cualquier ruta privada sin cookie → `401`
6. `organizer` intentando modificar/cancelar un evento ajeno → `403`; `admin` puede hacerlo sobre cualquier evento

## Próximas entregas

- Autenticación con providers externos (Google, GitHub, etc.) como nuevas estrategias en `passport.config.js`
- Inscripciones y control de cupos
- Notificaciones
