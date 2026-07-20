Actividad
Pre-entrega 4 — Autenticación centralizada con Passport.js
Objetivo

Refactorizar la autenticación existente para que pase por estrategias de Passport.js. El comportamiento externo de la API no cambia; solo mejora la organización interna.
Criterios de aceptación

Integración de Passport

    Passport inicializado en app.js
    Estrategias centralizadas en src/config/passport.config.js(no en app.js)

Estrategia de registro

    La lógica de POST /api/sessions/register(validación, normalización, bcrypt, unicidad, rol por defecto) vive dentro de una estrategia de Passport
    La ruta queda limpia y delega en passport.authenticate('register', ...)

Estrategia de login

    La validación de credenciales de POST /api/sessions/loginvive en una estrategia de Passport
    Tras autenticación exitosa, el controller (no la estrategia) genera el JWT y setea la cookie currentUser(httpOnly: true)
    Credenciales inválidas siguen respondiendo con mensaje genérico

Estrategia current

    Lee y valida el JWT desde la cookie
    Deja el usuario disponible en req.user
    GET /api/sessions/current usa esta estrategia como middleware
    Responde 401 sin token válido; devuelve { id, email, role }si es válido (sin password)

Logout

    POST /api/sessions/logout elimina la cookie; no requiere pasar por Passport

Preparación para futuras estrategias

    El archivo passport.config.jsestá estructurado para poder agregar nuevas estrategias (Google, GitHub, etc.) sin tocar app.js
    README menciona que el sistema queda preparado para providers externos

Repositorio

    .env.example completo; .envno subido
    README documenta estrategias implementadas, rutas y variables de entorno

Casos a probar antes de entregar

    Registro exitoso → login → /current→ logout → /currentdevuelve 401
    Registro con email duplicado
    Login con credenciales inválidas
    /current sin cookie o con token manipulado

🎯 Así se ve el entregable (para que sepas a qué apuntar)

Ojo: el contrato externo de la API no cambia respecto de la Pre-entrega 3 — las rutas y sus respuestas son las mismas. Lo que cambia es la organización interna (ahora pasa por estrategias de Passport).

1. Estructura (lo nuevo respecto de M3):

src/
├── config/
│   └── passport.config.js    # estrategias 'register', 'login' y 'current' centralizadas
├── app.js                    # passport.initialize()
├── routes/sessions.router.js # rutas delegan en passport.authenticate(...)
└── controllers/sessions.controller.js  # el controller (no la estrategia) genera el JWT y setea la cookie

2. Request/response (idéntico al contrato de M3):

POST /api/sessions/login → 200 + cookie currentUser HttpOnly:

json

{ "status": "success", "message": "Login correcto" }

GET /api/sessions/current (con cookie) → 200:

json

{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }

Credenciales inválidas → 401:

json

{ "status": "error", "message": "Credenciales inválidas" }

3. Qué evidencia adjuntar:

    README que documente las estrategias implementadas (register, login, current), las rutas y las variables de entorno, y que aclare que el sistema queda preparado para providers externos (Google/GitHub) sin tocar app.js.
    Recomendado: capturas del flujo register → login → /current (200) → logout → /current (401).

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.exampley README.
Qué evitar

    Mezclar la lógica de estrategias con app.js
    Que Passport genere el JWT (eso le corresponde al controller)
    Devolver o incluir passworden cualquier respuesta o payload
    Cambiar las rutas existentes (el contrato externo no varía)
    Subir .env, node_moduleso credenciales

Refactorizar el sistema de autenticación de la Plataforma de Eventos e Inscripciones incorporando Passport.js para centralizar y estandarizar las estrategias de registro, login y usuario actual.

Entregable

Centralización de autenticación con Passport.js

​

​

En esta pre entrega vas a refactorizar el sistema de autenticación de la Plataforma de Eventos e Inscripciones incorporando Passport.js.

El objetivo no es cambiar las rutas ni rehacer todo desde cero, sino centralizar la lógica de autenticación mediante estrategias para registro, login y usuario actual.

La API deberá seguir usando JWT y cookies HTTP Only, pero ahora Passport se encargará de organizar la validación de usuarios y credenciales. Después de este módulo, el proyecto quedará mejor preparado para sumar autorización por roles, protección de rutas sensibles, eventos, inscripciones y estrategias de autenticación más avanzadas.