# Plataforma de Eventos e Inscripciones

Proyecto final de **Backend II (Coderhouse)**: API REST para la gestión de eventos e inscripciones.

Esta pre-entrega establece la base arquitectónica del proyecto: un servidor Express organizado por capas (rutas, controladores, servicios, repositorios, DAO, modelos, middlewares y configuración), listo para escalar en las próximas entregas con autenticación, roles, gestión de eventos, inscripciones y notificaciones.

## Temática

Plataforma de Eventos e Inscripciones: permite a los usuarios explorar eventos, registrarse/loguearse e inscribirse, y a los organizadores gestionar sus eventos y cupos.

## Tecnologías

- Node.js
- Express
- MongoDB + Mongoose
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
├── app.js                # configura Express (no levanta el server)
├── server.js             # levanta el servidor
├── config/                # configuración (variables de entorno, etc.)
├── routes/                # definición de rutas por recurso
├── controllers/           # manejo de request/response
├── services/               # lógica de negocio
├── repositories/           # abstracción de acceso a datos
├── dao/                    # acceso directo a la base de datos
├── models/                  # modelos de datos (User, Event)
├── middlewares/             # middlewares de Express
└── utils/                   # utilidades varias
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

Ruta protegida por el middleware `auth` (`src/middlewares/auth.middleware.js`), que lee la cookie `currentUser`, verifica el JWT y guarda el payload en `req.user`.

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

- Passport (estrategias de autenticación)
- Roles y autorización
- Gestión completa de eventos
- Inscripciones y control de cupos
- Notificaciones
