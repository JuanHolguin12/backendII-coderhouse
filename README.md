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
├── app.js                     # configura Express + middleware de ruteo y errores (no levanta el server)
├── server.js                  # levanta el servidor
├── config/
│   ├── config.js               # variables de entorno (port, mongo_url, jwt, mailer)
│   ├── db.js                   # conexión a MongoDB
│   └── passport.config.js      # estrategias 'register', 'login' y 'current' centralizadas
├── middlewares/
│   ├── auth.middleware.js      # autenticación (ejecuta la estrategia 'current') → 401 si no hay sesión
│   └── authorize.middleware.js # autorización por rol → 403 si el rol no coincide
├── routes/                     # ruteo y delegación en middlewares/controladores
├── controllers/                # extracción de params y coordinación de request/response
├── services/                   # lógica de negocio y validación de reglas de negocio
├── repositories/                # abstracción e interfaz intermedia de persistencia de datos
├── dao/                         # operaciones directas de Mongoose sobre la base de datos
├── dto/                         # DTOs para estructurar respuestas (UserDto, EventDto, TicketDto)
├── models/                       # modelos y esquemas de Mongoose (User, Event, Ticket)
└── utils/                        # clases de error personalizadas, hashing y JWT helpers
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

## Eventos

`GET /api/events` y `GET /api/events/:id` son públicas. Crear, modificar y cambiar el estado (incluyendo cancelar) requieren sesión (`auth`) y rol `organizer` o `admin` (`authorize("organizer", "admin")`).

### Endpoints de Eventos

#### 1. Listar Eventos con Filtros, Paginación y Ordenamiento
* **Método:** `GET`
* **Ruta:** `/api/events`
* **Acceso:** Público (Suma filtros y paginación)
* **Query Parameters Soportados:**
  * `status`: Filtra por estado (`draft`, `published`, `cancelled`, `finished`).
  * `category`: Filtra por categoría.
  * `location`: Filtra por ubicación.
  * `dateFrom`: Filtra eventos desde una fecha exacta (ej: `2026-08-01`).
  * `dateTo`: Filtra eventos hasta una fecha exacta (ej: `2026-08-31`).
  * `page`: Número de página (por defecto `1`).
  * `limit`: Cantidad de resultados por página (por defecto `10`).
  * `sort`: Campo para ordenar los resultados (por defecto `date`, ascendente. Se puede usar `-date` para descendente, etc.).
* **Respuesta Exitosa (200):**
  ```json
  {
    "status": "success",
    "payload": {
      "data": [
        {
          "id": "673f4e...",
          "title": "Workshop Avanzado de Node",
          "description": "Aprende patrones avanzados y testing.",
          "category": "workshop",
          "date": "2026-10-15T18:00:00.000Z",
          "location": "Uruguay",
          "capacity": 25,
          "price": 10.5,
          "organizer": "65bfae...",
          "status": "published"
        }
      ],
      "page": 2,
      "limit": 5,
      "total": 6,
      "totalPages": 2
    }
  }
  ```

#### 2. Obtener Detalle de un Evento
* **Método:** `GET`
* **Ruta:** `/api/events/:id`
* **Acceso:** Público
* **Respuesta Exitosa (200):** Evento sanitizado correspondiente al ID.
* **Respuesta Error (404):** `{ "status": "error", "message": "Evento no encontrado" }`

#### 3. Crear Evento
* **Método:** `POST`
* **Ruta:** `/api/events`
* **Acceso:** `organizer`, `admin`
* **Body:**
  ```json
  {
    "title": "Congreso Tech 2026",
    "description": "El evento del año",
    "category": "tecnología",
    "date": "2026-12-01T09:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 150,
    "price": 15
  }
  ```
  *(Nota: El `organizer` se auto-asigna a partir del token JWT del usuario logueado en la request; es ignorado si viene en el body).*
* **Reglas de Negocio / Validaciones en Creación:**
  * Todos los campos mínimos son obligatorios.
  * No se permiten fechas en el pasado (`date < new Date()`).
  * La capacidad (`capacity`) debe ser mayor a 0.
  * El precio (`price`) debe ser mayor o igual a 0.
  * Por defecto, el estado asignado es `draft`.

#### 4. Modificar Evento
* **Método:** `PUT`
* **Ruta:** `/api/events/:id`
* **Acceso:** Organizador dueño del evento o `admin`
* **Reglas de Negocio / Validaciones en Modificación:**
  * Si el usuario logueado no es `admin` ni el creador del evento, responde con `403` (`No podés modificar un evento que no te pertenece`).
  * Si el evento actual posee un estado `cancelled` o `finished`, no se permiten modificaciones (responde `400`).
  * Si la capacidad es modificada, debe ser `capacity > 0`.
  * Si el precio es modificado, debe ser `price >= 0`.

#### 5. Modificar Estado / Cancelar Evento
* **Método:** `PATCH` o `DELETE`
* **Ruta:** `/api/events/:id/status` (o `DELETE /api/events/:id` para cancelar automáticamente)
* **Acceso:** Organizador dueño del evento o `admin`
* **Valores aceptados en status:** `draft`, `published`, `cancelled`, `finished`
* **Reglas de Negocio en Cambio de Estado:**
  * Si el evento ya se encuentra `cancelled` (cancelado) o `finished` (finalizado), no se permite retroceder o cambiar su estado (responde `400`).
  * Se requiere que el solicitante sea dueño del evento o un `admin` (responde `403` si no se cumple).
  * Los eventos cancelados permanencen archivados en la base de datos (no se eliminan físicamente).

---

### Casos a probar (roles, validaciones y filtros)

1. **Crear evento con rol user:** Intentar enviar un POST sin los permisos necesarios → `403` (`No tenés permisos para realizar esta acción`).
2. **Crear evento con fecha pasada:** Intentar crear un evento fechado en el pasado → `400` (`No se permiten fechas pasadas`).
3. **Crear evento con capacidad 0:** Intentar crear con capacidad inválida → `400` (`La capacidad debe ser mayor a 0`).
4. **Modificación exitosa por el creador:** Un `organizer` que creó el evento puede realizar PUT exitosamente.
5. **Modificación fallida por otro organizador:** Intentar modificar siendo un `organizer` que no es dueño del evento → `403` (`No podés modificar un evento que no te pertenece`).
6. **Modificación exitosa por administrador:** Un usuario con rol `admin` modifica un evento creado por cualquier organizador.
7. **Modificar evento cancelado:** Intentar aplicar PUT o PATCH en un evento cuyo estado ya es `cancelled` o `finished` → `400`.
8. **Búsqueda paginada y filtrada:** `GET /api/events?status=published&category=workshop&page=2&limit=5` devuelve los metadatos paginados (`page`, `limit`, `total`, `totalPages`, `data`) correspondientes a la consulta.
9. **Detalle de recurso inexistente:** `/api/events/<fake_id>` → `404` (`Evento no encontrado`).

## Inscripciones y Tickets

Esta pre-entrega implementa el flujo de registro de usuarios a eventos para control de cupos y emisión de comprobantes.

### Modelo de Ticket
El modelo `Ticket` (`src/models/Ticket.js`) gestiona las reservas y contiene referencias directas a `User` y `Event` en lugar de embeberlos.
- `user`: Referencia `ObjectId` al usuario inscrito.
- `event`: Referencia `ObjectId` al evento relacionado.
- `status`: Estado del ticket (`confirmed`, `pending`, `cancelled`).
- `quantity`: Cantidad de cupos reservados en la operación.
- `reservationCode`: Código único autogenerado con formato `RES-<HEX>`.
- `cancelledAt`: Marca de tiempo cuando el ticket fue cancelado.

### Endpoints de Inscripciones

#### 1. Inscribirse a un Evento (Emisión de Ticket)
* **Método:** `POST`
* **Ruta:** `/api/events/:eid/tickets`
* **Acceso:** Cualquier usuario autenticado (`auth`)
* **Body:**
  ```json
  {
    "quantity": 2
  }
  ```
* **Reglas de negocio y validación (en capa de servicios):**
  * El evento correspondiente a `eid` debe existir y tener estado `published`.
  * La cantidad (`quantity`) debe ser un entero positivo.
  * El total de cupos comprados (`quantity`) no puede superar los cupos disponibles:  
    $$\text{Cupos Disponibles} = \text{Capacidad total del evento} - \sum \text{quantity de tickets activos (confirmed/pending)}$$
  * Los tickets cancelados (`cancelled`) no ocupan cupo ni se cuentan.
  * Un usuario solo puede registrar **un ticket activo a la vez** por evento (evita inscripciones duplicadas).
  * Genera un código de reserva seguro y envía un correo electrónico de confirmación automático usando **Nodemailer**.

#### 2. Consultar mis Inscripciones
* **Método:** `GET`
* **Ruta:** `/api/tickets/my-tickets`
* **Acceso:** Usuario autenticado
* **Query Parameters:** `page`, `limit` (soporte de paginación)
* **Respuesta Exitosa (200):** Devuelve lista de tickets correspondientes al usuario. Se realiza populate sobre el evento mostrando únicamente: `title`, `date`, y `location` (seguridad de los datos).

#### 3. Ver Inscritos a un Evento
* **Método:** `GET`
* **Ruta:** `/api/events/:eid/tickets`
* **Acceso:** Organizador dueño del evento o usuario con rol `admin`
* **Respuesta Exitosa (200):** Colección de todos los tickets emitidos para ese evento específico. Responde `403` si se intenta consultar un evento ajeno.

#### 4. Cancelar Inscripción
* **Método:** `PATCH`
* **Ruta:** `/api/tickets/:tid/cancel`
* **Acceso:** Dueño del ticket o `admin`
* **Reglas de negocio:**
  * Al cancelar, el estado del ticket pasa a `cancelled` y se completa `cancelledAt`. El documento no se borra físicamente.
  * El cupo que ocupaba el ticket cancelado se libera y queda disponible inmediatamente para otros usuarios.
  * Responde con `403` si un usuario común intenta cancelar una reserva ajena.

---

### Configuración de Correo (Nodemailer)
Las credenciales de correo se administran desde variables de entorno y están centralizadas en `src/config/config.js`.

* **MAIL_HOST**: Servidor SMTP de correos (ej: `smtp.gmail.com`).
* **MAIL_PORT**: Puerto del servidor (ej: `587` o `465`).
* **MAIL_USER**: Cuenta de correo electrónico de origen.
* **MAIL_PASS**: Contraseña de aplicación o credencial del correo SMTP.
* **MAIL_FROM**: Dirección de remitente mostrada en el correo.

*Nota de desarrollo: Durante el entorno de testing o si las variables poseen valores genéricos/de prueba, el sistema simula el envío enviando un mensaje mockeado al log de consola en lugar de arrojar un error de SMTP, asegurando la continuidad del flujo.*

---

### Casos a probar (pre-entrega 7)

1. **Inscripción exitosa:** Retorna `201` con los datos del ticket y el estado inicial `confirmed`, logueando el envío de mail.
2. **Inscripción sin sesión:** Llamar a `/tickets` o `/events/:eid/tickets` sin autenticar → `401` (`No autenticado`).
3. **Inscripción a evento inexistente:** Registrar en `fake_id` → `404` (`Evento no encontrado`).
4. **Inscripción a evento no activo (draft/cancelled):** Intentar registrarse en evento no publicado → `400` (`El evento debe estar en estado publicado para poder inscribirse`).
5. **Inscripción por encima del cupo restante:** Intentar comprar más de los lugares permitidos → `400` (`Cupos insuficientes`).
6. **Inscripción duplicada activa:** Registrarse dos veces al mismo evento → `400` (`Ya tenés una inscripción activa para este evento`).
7. **Cancelación propia:** Un usuario cancela su propio ticket → `200` y libera el cupo. Una posterior inscripción por ese cupo funciona con éxito.
8. **Cancelación de ticket ajeno como user:** Intentar cancelar el ticket de otro usuario → `403` (`No tenés permisos para cancelar este ticket`).
9. **Listar tickets de evento como user común:** Solicitar el listado de tickets de un evento con rol `user` → `403` (`No tenés permisos para ver las inscripciones de este evento`).
10. **Listar tickets de evento ajeno como organizer:** Intentar ver inscripciones de un evento del cuál no eres organizador → `403`.

## Arquitectura por Capas y DTO (Data Transfer Object)

La aplicación sigue un diseño estrictamente estructurado por capas:
1. **Modelos** (`src/models/`): Mongoose define los esquemas (User, Event, Ticket). **Los modelos solo son importados en la capa DAO**, evitando que la lógica de negocio técnica de Mongoose se propague por todo el código.
2. **DAO** (`src/dao/`): Ejecuta directamente búsquedas y modificaciones en la base de datos de MongoDB.
3. **Repositories** (`src/repositories/`): Modulo intermedio que expone métodos limpios e independiza el ruteo de la lógica concreta de persistencia (siguiendo el patrón Repository). El servicio consume exclusivamente el repositorio.
4. **DTO** (`src/dto/`): Los controladores exponen información serializada a través de esta capa. Las clases `UserDto`, `EventDto` y `TicketDto` limpian y formatean los objetos antes de ser enviados en la respuesta JSON o en payloads de cookies, garantizando que el campo `password` o campos internos temporales de la base de datos **nunca sean expuestos al exterior**.
5. **Services** (`src/services/`): Contiene la lógica de negocio y las validaciones de los criterios de las entregas anteriores.
6. **Controllers/Routers** (`src/controllers/` y `src/routes/`): Manejan la recepción de parámetros, la autenticación y las respuestas HTTP, delegando el procesamiento pesado en los servicios.

---

### Flujo Completo de la Entrega Final

1. **Autenticación e Identidad:**
   * **Registro público:** `POST /api/sessions/register` crea un usuario con rol `user` por defecto (ignora cualquier rol provisto en el body). La respuesta del usuario viaja filtrada por `UserDto` (sin password).
   * **Login:** `POST /api/sessions/login` verifica credenciales, firma un JWT y lo devuelve en la cookie de seguridad `currentUser` (HttpOnly, SameSite Lax).
   * **Current:** `GET /api/sessions/current` brinda el usuario actualmente logueado mapeado vía `UserDto` (sin password).
   * **Logout:** `POST /api/sessions/logout` limpia la cookie de sesión.

2. **Gestión de Eventos:**
   * Un usuario con rol `user` común no tiene permisos para crear eventos (`403`).
   * Un organizador (`organizer`) crea un evento, el cual inicia en estado `draft`.
   * El organizador cambia el estado del evento a `published` (`PATCH /api/events/:eid/status`).
   * Un organizador no puede modificar eventos de terceros (`403`). Un `admin` puede modificar o actualizar cualquier evento (`200`).

3. **Inscripciones y Cupos:**
   * Un usuario se inscribe indicando la cantidad de entradas (`POST /api/events/:eid/tickets`). Se valida que el evento esté publicado y que cuente con cupos suficientes.
   * La operación deduce los cupos:
     $$\text{Cupos Libres} = \text{Capacidad} - \sum \text{quantity en Tickets activos}$$
   * Si el usuario se inscribe de nuevo o pida más entradas de las disponibles, la petición arroja error de conflicto (`409`).
   * Al inscribirse con éxito, se envía un correo de confirmación con **Nodemailer** y el código único de reserva (ej. `RES-A8FC13`), devolviendo el `TicketDto`.
   * El usuario o un `admin` pueden cancelar la inscripción (`PATCH /api/tickets/:tid/cancel`). El ticket pasa a `cancelled` y su marca de tiempo `cancelledAt` es guardada. El cupo se libera de manera automática.

4. **Usuarios e Inicios de Prueba:**
   * Si necesitás usuarios organizadores o administradores para pruebas manuales en Postman, podés crearlos directamente ejecutando las peticiones de registro o cambiando el campo `role` por consola de MongoDB (`"role": "organizer"` o `"role": "admin"`), o bien usando las credenciales automatizadas del script de tests.



