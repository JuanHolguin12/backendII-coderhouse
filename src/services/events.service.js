import { eventsRepository } from "../repositories/events.repository.js";
import { AppError } from "../utils/errors.js";

const REQUIRED_FIELDS = ["title", "date", "location", "capacity"];

const sanitizeEvent = (event) => ({
  id: event._id,
  title: event.title,
  description: event.description,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  organizer: event.organizer,
  status: event.status,
});

const isOwner = (event, userId) => event.organizer.toString() === userId.toString();

const pickDefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

class EventsService {
  async getPublished() {
    const events = await eventsRepository.getPublished();
    return events.map(sanitizeEvent);
  }

  async getById(id) {
    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }
    return sanitizeEvent(event);
  }

  async create({ title, description, date, location, capacity }, organizerId) {
    for (const field of REQUIRED_FIELDS) {
      if (!{ title, date, location, capacity }[field]) {
        throw new AppError("Faltan campos obligatorios", 400);
      }
    }

    const newEvent = await eventsRepository.create({
      title,
      description,
      date,
      location,
      capacity,
      organizer: organizerId,
    });

    return sanitizeEvent(newEvent);
  }

  async update(id, updates, requestingUser) {
    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    if (requestingUser.role !== "admin" && !isOwner(event, requestingUser.id)) {
      throw new AppError("No podés modificar un evento que no te pertenece", 403);
    }

    const { title, description, date, location, capacity } = updates;
    const updatedEvent = await eventsRepository.updateById(
      id,
      pickDefined({ title, description, date, location, capacity })
    );

    return sanitizeEvent(updatedEvent);
  }

  async cancel(id, requestingUser) {
    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    if (requestingUser.role !== "admin" && !isOwner(event, requestingUser.id)) {
      throw new AppError("No podés cancelar un evento que no te pertenece", 403);
    }

    const cancelledEvent = await eventsRepository.cancelById(id);
    return sanitizeEvent(cancelledEvent);
  }
}

export const eventsService = new EventsService();
