Actividad
Pre-entrega 6: Entidad events y lógica de negocio
Objetivo

Construir el CRUD completo de eventos con validaciones de negocio, control de permisos por rol y listado con filtros, paginación y ordenamiento.
Criterios de aceptación

Modelo Event

    Campos mínimos: title, description, category, date, location, capacity, price, status, organizer
    organizer es una referencia (ObjectId) al Userque creó el evento, no un objeto embebido
    status acepta solo valores definidos: draft, published, cancelled, finished
    capacity > 0; price≥ 0; title, description, category, locationobligatorios

Endpoints
Método	Ruta	Acceso
POST	/api/events	organizer, admin
GET	/api/events	público
GET	/api/events/:id	público
PUT	/api/events/:id	dueño del evento o admin
PATCH	/api/events/:id/status	dueño del evento o admin

    Al crear, organizerse asigna automáticamente desde req.user; no puede venir del body
    Un organizerno puede modificar eventos ajenos (sí puede admin)
    Eventos cancelados no pueden modificarse (salvo justificación documentada)
    Cancelar = cambiar statusa cancelled; no se eliminan físicamente

Validaciones de negocio (en la capa services, no en las rutas)

    No permitir fecha pasada al crear
    No permitir publicar eventos ya finalizados o cancelados
    Rechazar capacity≤ 0 o price< 0

Listado con filtros (GET /api/events)

    Filtra por: status, category, location, rango de fechas (dateFrom, dateTo)
    Soporta paginación (page, limit)
    Soporta ordenamiento (ej. sort=date)
    Respuesta incluye: data, page, limit, total, totalPages

Arquitectura

    Lógica de negocio en services; acceso a datos en repositories/DAO; controllers solo manejan request/response

README

    Documenta rutas de eventos, filtros disponibles, roles requeridos y reglas de negocio principales

Casos a probar antes de entregar

    Crear evento con rol user→ 403
    Crear evento con fecha pasada → error de validación
    Crear evento con capacity: 0→ error de validación
    organizer modifica evento propio → éxito
    organizer modifica evento ajeno → 403
    admin modifica evento de otro organizador → éxito
    Cambiar estado de evento cancelado → error
    Listar con filtros: ?status=published&category=workshop&page=2&limit=5
    Consultar evento inexistente → 404

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.exampley README.
Qué evitar

    Guardar el objeto completo del usuario como organizer(usar referencia)
    Eliminar eventos físicamente de la base de datos
    Poner validaciones de negocio directamente en las rutas o controllers
    Devolver todos los eventos sin paginación
    Subir .env, node_moduleso credenciales
