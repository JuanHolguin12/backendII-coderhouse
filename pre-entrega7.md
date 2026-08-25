Actividad
Pre-entrega 7: Tickets, inscripciones y control de cupos
Objetivo

Implementar el flujo completo de inscripción a eventos: crear tickets con control de cupos, evitar duplicados, permitir cancelaciones y enviar email de confirmación con Nodemailer.
Criterios de aceptación

Modelo Ticket(o Enrollment/Inscription)

    Campos mínimos: referencia a user(ObjectId), referencia a event(ObjectId), status, quantity, reservationCode, createdAt, cancelledAt
    status acepta solo valores definidos: confirmed, pending, cancelled
    Sin objetos embebidos: solo referencias

Endpoints
Método	Ruta	Acceso
POST	/api/events/:eid/tickets	autenticado
GET	/api/tickets/my-tickets	autenticado (propios)
GET	/api/events/:eid/tickets	organizer (propios eventos) o admin
PATCH	/api/tickets/:tid/cancel	dueño del ticket o admin

Validaciones al inscribirse (en services, no en el controller)

    El evento existe
    El evento está en estado published
    El evento no está cancelado ni finalizado
    quantity es un número válido (> 0)
    Cupos disponibles ≥ quantitysolicitada (solo cuentan tickets con status activo; los cancelledno ocupan cupo)
    El usuario no tiene ya un ticket activo para ese evento (si la regla es una inscripción por usuario)

Cancelación

    Cambia statusa cancelledy registra cancelledAt; no elimina el documento
    Valida que el ticket exista, pertenezca al solicitante (o sea admin) y no esté ya cancelado
    Al cancelar, el cupo queda disponible automáticamente (por no contarse en el cálculo)

Consulta de mis tickets

    Responde con tickets del usuario autenticado
    Incluye datos del evento via populate: title, date, location
    No expone datos sensibles de otros usuarios

Notificaciones

    Nodemailer envía email al confirmar una inscripción
    Credenciales en variables de entorno: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM; nunca hardcodeadas
    .env.example incluye estas variables

README

    Documenta rutas, estados de ticket, flujo de inscripción, regla de cupos y variables de email

Casos a probar antes de entregar

    Inscripción exitosa → email recibido
    Inscripción sin sesión → 401
    Inscripción a evento inexistente → 404
    Inscripción a evento cancelado/finalizado → error de negocio
    Inscripción cuando no hay cupo suficiente → error con mensaje claro
    Inscripción duplicada activa → error
    Cancelación propia → cupo liberado (nueva inscripción por ese cupo funciona)
    Cancelación de ticket ajeno como user→ 403
    GET /api/events/:eid/tickets como usercomún → 403
    GET /api/events/:eid/tickets como organizerde otro evento → 403

Cómo entregar

Link a repositorio público de GitHub con package.json, .gitignore, .env.exampley README.
Qué evitar

    Guardar el objeto completo del usuario o evento dentro del ticket (usar referencias)
    Contar tickets cancelleden el cálculo de cupos ocupados
    Eliminar tickets físicamente
    Hardcodear credenciales de email en el código
    Poner la lógica de validación de cupos en el controller o en la ruta
    Subir .env, node_moduleso credenciales
