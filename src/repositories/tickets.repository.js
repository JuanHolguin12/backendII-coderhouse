import { ticketsDao } from "../dao/tickets.dao.js";

class TicketsRepository {
  async create(ticketData) {
    return ticketsDao.create(ticketData);
  }

  async getById(id) {
    return ticketsDao.findById(id);
  }

  async getByUserAndEventActive(userId, eventId) {
    return ticketsDao.findByUserAndEventActive(userId, eventId);
  }

  async getActiveByEvent(eventId) {
    return ticketsDao.findActiveByEvent(eventId);
  }

  async getPaginated({ query, page, limit }) {
    return ticketsDao.findWithPagination({ query, page, limit });
  }

  async updateById(id, updates) {
    return ticketsDao.updateById(id, updates);
  }
}

export const ticketsRepository = new TicketsRepository();
