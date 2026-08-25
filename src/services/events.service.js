import { eventsRepository } from "../repositories/events.repository.js";
import { AppError } from "../utils/errors.js";
import { EventDto } from "../dto/event.dto.js";

const REQUIRED_FIELDS = ["title", "description", "category", "date", "location", "capacity", "price"];



const isOwner = (event, userId) => event.organizer.toString() === userId.toString();

const pickDefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

class EventsService {
  async getAll({ status, category, location, dateFrom, dateTo, page = 1, limit = 10, sort = "date" }) {
    const query = {};

    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = location;
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const result = await eventsRepository.getAll({ query, page, limit, sort });

    return {
      data: result.data.map((event) => new EventDto(event)),
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  async getPublished() {
    const events = await eventsRepository.getPublished();
    return events.map((event) => new EventDto(event));
  }

  async getById(id) {
    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }
    return new EventDto(event);
  }

  async create({ title, description, category, date, location, capacity, price }, organizerId) {
    for (const field of REQUIRED_FIELDS) {
      const val = { title, description, category, date, location, capacity, price }[field];
      if (val === undefined || val === null || val === "") {
        throw new AppError("Faltan campos obligatorios", 400);
      }
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      throw new AppError("Fecha inválida", 400);
    }
    if (eventDate < new Date()) {
      throw new AppError("No se permiten fechas pasadas", 400);
    }

    if (capacity <= 0) {
      throw new AppError("La capacidad debe ser mayor a 0", 400);
    }
    if (price < 0) {
      throw new AppError("El precio debe ser mayor o igual a 0", 400);
    }

    const newEvent = await eventsRepository.create({
      title,
      description,
      category,
      date,
      location,
      capacity,
      price,
      organizer: organizerId,
    });

    return new EventDto(newEvent);
  }

  async update(id, updates, requestingUser) {
    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    if (event.status === "cancelled") {
      throw new AppError("No se pueden modificar eventos cancelados", 400);
    }
    if (event.status === "finished") {
      throw new AppError("No se pueden modificar eventos finalizados", 400);
    }

    if (requestingUser.role !== "admin" && !isOwner(event, requestingUser.id)) {
      throw new AppError("No podés modificar un evento que no te pertenece", 403);
    }

    if (updates.capacity !== undefined && updates.capacity <= 0) {
      throw new AppError("La capacidad debe ser mayor a 0", 400);
    }
    if (updates.price !== undefined && updates.price < 0) {
      throw new AppError("El precio debe ser mayor o igual a 0", 400);
    }

    const { title, description, category, date, location, capacity, price } = updates;
    const updatedEvent = await eventsRepository.updateById(
      id,
      pickDefined({ title, description, category, date, location, capacity, price })
    );

    return new EventDto(updatedEvent);
  }

  async updateStatus(id, newStatus, requestingUser) {
    const ALLOWED_STATUSES = ["draft", "published", "cancelled", "finished"];
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      throw new AppError("Estado no válido", 400);
    }

    const event = await eventsRepository.getById(id);
    if (!event) {
      throw new AppError("Evento no encontrado", 404);
    }

    if (event.status === "cancelled") {
      throw new AppError("No se puede modificar el estado de un evento cancelado", 400);
    }
    if (event.status === "finished") {
      throw new AppError("No se puede modificar el estado de un evento finalizado", 400);
    }

    if (requestingUser.role !== "admin" && !isOwner(event, requestingUser.id)) {
      throw new AppError("No podés modificar un evento que no te pertenece", 403);
    }

    const updatedEvent = await eventsRepository.updateById(id, { status: newStatus });
    return new EventDto(updatedEvent);
  }

  async cancel(id, requestingUser) {
    return this.updateStatus(id, "cancelled", requestingUser);
  }
}

export const eventsService = new EventsService();
