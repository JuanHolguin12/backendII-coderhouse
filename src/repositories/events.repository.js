import { eventsDao } from "../dao/events.dao.js";

class EventsRepository {
  async create(eventData) {
    return eventsDao.create(eventData);
  }

  async getPublished() {
    return eventsDao.findPublished();
  }

  async getById(id) {
    return eventsDao.findById(id);
  }

  async getAll({ query, page, limit, sort }) {
    return eventsDao.findPaginated({ query, page, limit, sort });
  }

  async updateById(id, updates) {
    return eventsDao.updateById(id, updates);
  }

  async cancelById(id) {
    return eventsDao.cancelById(id);
  }
}

export const eventsRepository = new EventsRepository();
