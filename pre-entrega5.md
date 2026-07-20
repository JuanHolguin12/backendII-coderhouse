Actividad
Pre-entrega 5: Roles y autorización
Objetivo

Implementar un sistema de autorización por roles que proteja rutas según lo que cada rol puede hacer, diferenciando correctamente errores 401 y 403.
Criterios de aceptación

Roles

    Modelo User tiene campo role con valores user, organizer, admin y default user
    El registro público no permite crear admin u organizer desde el body

Matriz de permisos (debe existir una definición clara; adaptar según temática)
Acción	user	organizer	admin
Consultar eventos publicados	✅	✅	✅
Crear eventos	❌	✅	✅
Modificar/cancelar eventos propios	❌	✅	✅
Modificar cualquier evento	❌	❌	✅
Ver todos los usuarios	❌	❌	✅

Middlewares

    Middleware de autenticación: lee JWT desde cookie, valida, puebla req.user, responde 401 si no hay sesión válida
    Middleware de autorización: recibe roles permitidos como parámetro, compara contra req.user.role, responde 403 si no coincide
    Ambos middlewares son reutilizables y están separados del código de rutas

Rutas protegidas (mínimo exigido)

    GET /api/sessions/current → solo autenticados (401 si no hay sesión)
    POST /api/events → solo organizer o admin (403 para user)
    Al menos una ruta administrativa → solo admin

Propiedad de recursos

    Al menos una validación inicial: organizer solo puede modificar sus propios eventos; admin puede modificar cualquiera

Errores

    401 cuando no hay sesión
    403 cuando hay sesión pero sin permisos
    No usar 500 como respuesta genérica para estos casos

README

    Documenta roles, matriz de permisos, rutas protegidas y diferencia entre 401 y 403

Casos a probar antes de entregar

    POST /api/events con rol user → 403
    POST /api/events con rol organizer → éxito
    Ruta administrativa con rol organizer → 403
    Ruta administrativa con rol admin → éxito
    Cualquier ruta privada sin cookie → 401
    organizer intentando modificar evento ajeno → error

​
🎯 Así se ve el entregable (para que sepas a qué apuntar)

1. Estructura (lo nuevo):

src/
├── middlewares/
│   ├── auth.middleware.js         # valida JWT de la cookie → 401 si no hay sesión
│   └── authorize.middleware.js    # recibe roles permitidos → 403 si el rol no coincide
└── routes/events.router.js        # aplica ambos middlewares en las rutas protegidas

2. Request/response — la clave es diferenciar 401 de 403:

POST /api/events con rol user → 403 (autenticado pero sin permiso):

json

{ "status": "error", "message": "No tenés permisos para realizar esta acción" }

POST /api/events con rol organizer o admin → 201:

json

{ "status": "success", "payload": { "id": "6690...", "title": "Congreso Tech 2026", "organizer": "665f2a..." } }

Ruta privada sin cookie → 401 (no autenticado):

json

{ "status": "error", "message": "No autenticado" }

3. Qué evidencia adjuntar:

    README con la matriz de permisos (qué puede hacer user, organizer, admin), las rutas protegidas y la diferencia explícita entre 401 (sin sesión) y 403 (sin permiso).
    Recomendado: capturas mostrando POST /api/events con user (403) y con organizer (201), y una ruta administrativa con organizer (403) vs admin (200).

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.example y README.
Qué evitar

    Validar permisos solo en el frontend o en la lógica de negocio (debe hacerse en el middleware)
    Usar el mismo código de error (401 ó 403) para ambos casos
    Hardcodear roles dentro de las rutas en lugar de usar el middleware reutilizable
    Subir .env, node_modules o credenciales

Diseñar e implementar un sistema de autorización basado en roles para la Plataforma de Eventos e Inscripciones.

Entregable
Roles y autorización profesional

En esta pre entrega vas a incorporar un sistema de autorización profesional basado en roles dentro de la Plataforma de Eventos e Inscripciones.

El sistema ya debería poder reconocer usuarios autenticados. Ahora deberá poder decidir qué acciones puede realizar cada usuario según su rol.

Vas a definir roles como admin, organizer y user, crear una matriz de permisos, implementar middlewares reutilizables y proteger rutas sensibles del proyecto.

El objetivo es que la API empiece a comportarse como un backend profesional, donde no alcanza con iniciar sesión: cada acción debe estar validada según permisos reales del usuario.