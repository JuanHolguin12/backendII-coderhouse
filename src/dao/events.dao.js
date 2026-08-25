import { Event } from "../models/Event.js";

class EventsDao {
  async create(eventData) {
    return Event.create(eventData);
  }

  async findPublished() {
    return Event.find({ status: "published" }).sort({ date: 1 });
  }

  async findById(id) {
    return Event.findById(id);
  }

  async findPaginated({ query = {}, page = 1, limit = 10, sort = "date" }) {
    const skip = (page - 1) * limit;
    const data = await Event.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
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
    return Event.findByIdAndUpdate(id, updates, { new: true });
  }

  async cancelById(id) {
    return Event.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });
  }
}

export const eventsDao = new EventsDao();
