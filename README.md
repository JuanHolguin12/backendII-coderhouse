# Plataforma de Eventos e Inscripciones

Proyecto final de **Backend II (Coderhouse)**: API REST para la gestión de eventos e inscripciones.

Esta pre-entrega establece la base arquitectónica del proyecto: un servidor Express organizado por capas (rutas, controladores, servicios, repositorios, DAO, modelos, middlewares y configuración), listo para escalar en las próximas entregas con autenticación, roles, gestión de eventos, inscripciones y notificaciones.

## Temática

Plataforma de Eventos e Inscripciones: permite a los usuarios explorar eventos, registrarse/loguearse e inscribirse, y a los organizadores gestionar sus eventos y cupos.

## Tecnologías

- Node.js
- Express
- dotenv
- Módulos ESM (import/export)
- MongoDB (a integrar en próximas entregas)

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

   | Variable    | Descripción                                  |
   | ----------- | --------------------------------------------- |
   | PORT        | Puerto donde se levanta el servidor           |
   | NODE_ENV    | Entorno de ejecución (development/production) |
   | MONGO_URL   | URL de conexión a MongoDB                     |
   | JWT_SECRET  | Secreto para firmar tokens JWT                |

## Cómo ejecutar

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

| Método | Ruta                  | Descripción                                    |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | /api/health            | Verifica que el servidor está activo            |
| GET    | /api/events             | Lista de eventos (vacía por el momento)         |
| POST   | /api/sessions/register  | Registro de usuario (aún sin lógica de auth)    |
| POST   | /api/sessions/login     | Login de usuario (aún sin lógica de auth)       |

## Próximas entregas

- Registro y login con JWT y cookies
- Passport (estrategias de autenticación)
- Roles y autorización
- Gestión completa de eventos
- Inscripciones y control de cupos
- Notificaciones
