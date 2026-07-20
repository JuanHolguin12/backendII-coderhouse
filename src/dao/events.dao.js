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

  async updateById(id, updates) {
    return Event.findByIdAndUpdate(id, updates, { new: true });
  }

  async cancelById(id) {
    return Event.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });
  }
}

export const eventsDao = new EventsDao();
