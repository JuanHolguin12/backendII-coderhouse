import { eventsRepository } from "../repositories/events.repository.js";

class EventsService {
  async getAll() {
    return eventsRepository.getAll();
  }
}

export const eventsService = new EventsService();
