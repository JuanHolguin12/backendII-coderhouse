import crypto from "crypto";
import { ticketsRepository } from "../repositories/tickets.repository.js";
import { eventsRepository } from "../repositories/events.repository.js";
import { mailService } from "./mail.service.js";
import { AppError } from "../utils/errors.js";

const sanitizeTicket = (ticket) => ({
  id: ticket._id,
  user: ticket.user,
  event: ticket.event,
  status: ticket.status,
  quantity: ticket.quantity,
  reservationCode: ticket.reservationCode,
  createdAt: ticket.createdAt,
  cancelledAt: ticket.cancelledAt,
});

class TicketsService {
  async createTicket({ eventId, quantity }, requestingUser) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new AppError("La cantidad de entradas debe ser un número entero mayor a 0", 400);
    }

    // 1. Obtener y validar el evento
    const event = await eventsRepository.getById(eventId);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    // 2. Estado "published", no cancelado ni finalizado
    if (event.status !== "published") {
      throw new AppError("El evento debe estar en estado publicado para poder inscribirse", 400);
    }

    // 3. Control de cupos
    const activeTickets = await ticketsRepository.getActiveByEvent(eventId);
    const occupiedCapacity = activeTickets.reduce((sum, tkt) => sum + tkt.quantity, 0);
    const availableCapacity = event.capacity - occupiedCapacity;

    if (qty > availableCapacity) {
      throw new AppError(`Cupos insuficientes. Cupos disponibles: ${availableCapacity}`, 400);
    }

    // 4. Inscripción duplicada activa (una sola inscripción confirmada/pendiente por usuario)
    const existingActiveTicket = await ticketsRepository.getByUserAndEventActive(requestingUser.id, eventId);
    if (existingActiveTicket) {
      throw new AppError("Ya tenés una inscripción activa para este evento", 400);
    }

    // 5. Generar código de reserva único
    const reservationCode = "RES-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    // 6. Guardar ticket
    const ticket = await ticketsRepository.create({
      user: requestingUser.id,
      event: eventId,
      status: "confirmed",
      quantity: qty,
      reservationCode,
    });

    // 7. Enviar email de confirmación (asíncronamente, no bloquea respuesta)
    mailService.sendTicketConfirmation(requestingUser.email, ticket, event);

    return sanitizeTicket(ticket);
  }

  async cancelTicket(ticketId, requestingUser) {
    // 1. Validar existencia
    const ticket = await ticketsRepository.getById(ticketId);
    if (!ticket) {
      throw new AppError("Ticket no encontrado", 404);
    }

    // 2. No cancelado ya
    if (ticket.status === "cancelled") {
      throw new AppError("El ticket ya está cancelado", 400);
    }

    // 3. Dueño o admin
    if (requestingUser.role !== "admin" && ticket.user.toString() !== requestingUser.id.toString()) {
      throw new AppError("No tenés permisos para cancelar este ticket", 403);
    }

    // 4. Cancelar
    const updatedTicket = await ticketsRepository.updateById(ticketId, {
      status: "cancelled",
      cancelledAt: new Date(),
    });

    return sanitizeTicket(updatedTicket);
  }

  async getEventTickets(eventId, requestingUser) {
    // Obtener evento para verificar ownership
    const event = await eventsRepository.getById(eventId);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    // Solo organizer dueño del evento o admin
    if (requestingUser.role !== "admin" && event.organizer.toString() !== requestingUser.id.toString()) {
      throw new AppError("No tenés permisos para ver las inscripciones de este evento", 403);
    }

    const tickets = await ticketsRepository.getPaginated({
      query: { event: eventId },
      page: 1,
      limit: 1000,
    });

    return tickets.data.map(sanitizeTicket);
  }

  async getMyTickets(userId, { page = 1, limit = 10 } = {}) {
    const result = await ticketsRepository.getPaginated({
      query: { user: userId },
      page,
      limit,
    });

    return {
      data: result.data.map((tkt) => {
        const sanitized = sanitizeTicket(tkt);
        if (tkt.event) {
          sanitized.event = {
            id: tkt.event._id,
            title: tkt.event.title,
            date: tkt.event.date,
            location: tkt.event.location,
          };
        }
        return sanitized;
      }),
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    };
  }
}

export const ticketsService = new TicketsService();
