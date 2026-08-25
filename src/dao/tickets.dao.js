import { Ticket } from "../models/Ticket.js";

class TicketsDao {
  async create(ticketData) {
    return Ticket.create(ticketData);
  }

  async findById(id) {
    return Ticket.findById(id);
  }

  async findByUserAndEventActive(userId, eventId) {
    return Ticket.findOne({
      user: userId,
      event: eventId,
      status: { $in: ["confirmed", "pending"] },
    });
  }

  async findActiveByEvent(eventId) {
    return Ticket.find({
      event: eventId,
      status: { $in: ["confirmed", "pending"] },
    });
  }

  async findWithPagination({ query = {}, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const data = await Ticket.find(query)
      .populate("event", "title date location")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    };
  }

  async updateById(id, updates) {
    return Ticket.findByIdAndUpdate(id, updates, { new: true });
  }
}

export const ticketsDao = new TicketsDao();
