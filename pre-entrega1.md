Actividad
Pre-entrega 1: Refactor arquitectónico inicial para plataforma de eventos
Objetivo

Crear la estructura base de una API REST con Express, organizada por capas, lista para escalar en entregas posteriores.
Qué entregar

Repositorio público de GitHub con un servidor Express funcional, separado en capas, con estructura inicial para los recursos events y sessions.
Criterios de aceptación

Servidor

    app.js configura Express (con express.json()); server.js levanta el servidor
    Puerto configurable por variable de entorno
    GET /api/health devuelve respuesta indicando que el servidor está activo

Estructura de carpetas (deben existir, aunque algunas estén vacías)

    config/, routes/, controllers/, services/, repositories/, dao/, models/, middlewares/, utils/

Recursos

    GET /api/events con ruta y controlador propios (puede devolver lista vacía)
    Estructura inicial para sessions (ruta y controlador, sin lógica de auth)

Modelos

    Archivo base para User (campos mínimos)
    Archivo base para Event (campos mínimos)

Configuración y documentación

    dotenv configurado; .env.example con PORT, NODE_ENV, MONGO_URL, JWT_SECRET
    .gitignore que excluya .env y node_modules
    README.md con: nombre del proyecto, temática elegida, tecnologías, instalación, configuración de variables, cómo ejecutar, estructura de carpetas, rutas disponibles
    Módulos ESM (import/export)

🎯 Así se ve el entregable (para que sepas a qué apuntar)

1. Estructura de carpetas esperada:

proyecto-eventos/
├── src/
│   ├── app.js                # configura Express (NO levanta el server)
│   ├── server.js             # levanta el servidor
│   ├── config/
│   ├── routes/
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── dao/
│   ├── models/
│   │   ├── User.js           # campos mínimos
│   │   └── Event.js          # campos mínimos
│   ├── middlewares/
│   └── utils/
├── .env.example              # PORT, NODE_ENV, MONGO_URL, JWT_SECRET
├── .gitignore                # excluye .env y node_modules
├── package.json
└── README.md

2. Request/response de los endpoints de esta etapa:

GET /api/health → 200:

json

{ "status": "ok", "message": "Servidor activo" }

GET /api/events → 200 (lista vacía al inicio, todavía sin lógica):

json

{ "status": "success", "payload": [] }

3. Qué evidencia adjuntar:

    README con: nombre y temática del proyecto, tecnologías, instalación, variables de entorno, cómo ejecutar, estructura de carpetas y rutas disponibles.
    Opcional: captura de GET /api/health respondiendo OK.

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.example y README incluidos.
Qué evitar

    Lógica de rutas o controladores directamente en app.js
    Subir .env, node_modules o credenciales
    Código comentado sin uso

Preparar la base inicial del proyecto de Backend II mediante un refactor arquitectónico de una API existente o una estructura base nueva, orientada al proyecto final de Plataforma de Eventos e Inscripciones.

Entregable
Base arquitectónica para Plataforma de Eventos

En esta pre entrega vas a preparar la base arquitectónica del proyecto de Backend II.

El objetivo es comenzar a transformar una API básica en una API más profesional, organizada y preparada para crecer. Para eso, vas a configurar un servidor Express, trabajar con variables de entorno y separar el proyecto en capas como rutas, controladores, servicios, repositorios, DAO, modelos, middlewares y configuración.

Todavía no vas a desarrollar toda la autenticación, roles, eventos completos ni tickets. En esta etapa, lo importante es dejar armado un punto de partida sólido para la Plataforma de Eventos e Inscripciones. Esta estructura será la base para las próximas entregas, donde se incorporarán registro, login, JWT, cookies, Passport, roles, autorización, gestión de eventos, inscripciones, control de cupos y notificaciones.