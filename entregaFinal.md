Actividad
Entrega final: API Backend plataforma de eventos
Objetivo

Presentar la versión completa e integrada de la API construida durante el curso, incorporando todas las funcionalidades de las entregas anteriores en una arquitectura profesional por capas.
Qué entregar

Repositorio público de GitHub con la API funcional. No es un proyecto nuevo: es la evolución del proyecto de las pre-entregas anteriores.
Criterios de aceptación

Autenticación y usuarios

    Modelo User con first_name, last_name, email, password (hasheada con bcrypt), role
    POST /api/sessions/register, POST /api/sessions/login, GET /api/sessions/current, POST /api/sessions/logout
    Login genera JWT guardado en cookie httpOnly; ninguna respuesta devuelve password
    Passport con estrategias register, login y current

Roles y autorización

    Roles: user, organizer, admin; user por defecto en registro público
    Middleware de autenticación (401) y middleware de autorización por rol (403) aplicados en rutas concretas
    Registro público no acepta role desde el body

Eventos

    Modelo Event con: title, description, category, date, location, capacity, price, status (draft/published/cancelled/finished), organizer (referencia a User)
    CRUD: POST, GET, GET /:id, PUT /:id, PATCH /:id/status
    Solo organizer/admin crean eventos; solo dueño o admin modifican/cancelan
    Validaciones: no fecha pasada, capacity > 0, price ≥ 0, no modificar eventos cancelados
    Listado con filtros por status, category, location, rango de fechas; paginación y ordenamiento
    Respuesta de listado incluye data, page, limit, total, totalPages

Tickets / Inscripciones

    Modelo con referencias (no objetos embebidos) a user y event; campos: status, quantity, reservationCode, createdAt, cancelledAt
    POST /api/events/:eid/tickets — valida: evento publicado, cupo suficiente, sin duplicado activo
    Tickets cancelled no cuentan como cupo ocupado
    GET /api/tickets/my-tickets — propios, con populate de datos básicos del evento
    GET /api/events/:eid/tickets — solo organizer dueño o admin
    PATCH /api/tickets/:tid/cancel — cambia estado, no elimina; solo dueño o admin

Notificaciones

    Nodemailer envía email al confirmar inscripción; credenciales solo en variables de entorno

Arquitectura

    Capas presentes: routes, controllers, services, repositories, dao, dto, models, middlewares, utils, config
    Modelos de Mongoose solo importados en DAOs
    Services consumen repositories; controllers solo coordinan request/response
    DTOs aplicados en respuestas de usuario, evento y ticket
    Middleware centralizado de errores; respuestas usan 400/401/403/404/409/500 según corresponda

Variables de entorno

    .env.example incluye: PORT, MONGO_URL, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV, MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM

README

    Incluye: temática, tecnologías, instalación, variables de entorno, comandos, roles, usuarios de prueba o cómo crearlos, listado de endpoints, ejemplos de uso, flujo de autenticación e inscripción

🎯 Así se ve el entregable (para que sepas a qué apuntar)

Es la evolución del proyecto, con arquitectura completa por capas.

1. Estructura esperada:

src/
├── routes/  controllers/  services/  repositories/  dao/  dto/  models/  middlewares/  utils/  config/

Regla de oro: los modelos de Mongoose solo se importan en los DAO; los services usan repositories; los controllers solo coordinan request/response; las respuestas de usuario, evento y ticket pasan por DTO (nunca exponen password).

2. Request/response de los endpoints clave:

GET /api/events?status=published&page=2&limit=5 → 200 (listado paginado):

json

{ "status": "success", "data": [ { "id": "...", "title": "Congreso Tech 2026", "status": "published" } ], "page": 2, "limit": 5, "total": 27, "totalPages": 6 }

POST /api/events/:eid/tickets (evento publicado, con cupo) → 201:

json

{ "status": "success", "payload": { "id": "...", "event": "6690...", "user": "665f...", "quantity": 1, "status": "active", "reservationCode": "EVT-7QK2" } }

Inscripción duplicada o sin cupo → 409:

json

{ "status": "error", "message": "Ya tenés una inscripción activa a este evento" }

3. Qué evidencia adjuntar:

    README completo: temática, tecnologías, instalación, variables de entorno, comandos, roles, cómo crear usuarios de prueba, listado de endpoints, ejemplos de uso y el flujo de autenticación + inscripción.
    Recomendado: colección de Postman con el flujo completo, y/o capturas de los 10 casos del "Flujo completo a verificar" (registro→login→inscripción→email→cupo, 401/403, paginación).

Flujo completo a verificar antes de entregar

    Registro → login → /current → logout → /current devuelve 401
    user intenta crear evento → 403
    organizer crea evento → user se inscribe → email recibido → cupo descontado
    user intenta inscribirse nuevamente al mismo evento → error de duplicado
    user intenta inscribirse a evento sin cupo → error claro
    user cancela su ticket → cupo liberado → nueva inscripción funciona
    organizer intenta modificar evento ajeno → 403
    admin modifica evento de otro organizador → éxito
    Respuestas de usuario, evento y ticket no contienen password
    Listado de eventos con ?status=published&page=2&limit=5 devuelve estructura paginada

Cómo entregar

Link a repositorio público de GitHub. Opcionalmente: colección de Postman o deploy (consultar si es obligatorio en tu cursada).
Qué evitar

    Controllers que importan modelos de Mongoose directamente
    Lógica de negocio en rutas o controllers
    password en cualquier respuesta o payload de JWT
    Credenciales de email o JWT hardcodeadas
    console.log innecesarios
    Subir .env, node_modules o credenciales
