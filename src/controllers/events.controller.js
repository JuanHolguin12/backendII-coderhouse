import { eventsService } from "../services/events.service.js";

export const getEvents = async (req, res) => {
  try {
    const { status, category, location, dateFrom, dateTo, page, limit, sort } = req.query;
    const result = await eventsService.getAll({
      status,
      category,
      location,
      dateFrom,
      dateTo,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
    });
    res.status(200).json({ status: "success", payload: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await eventsService.getById(req.params.id);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await eventsService.create(req.body, req.user.id);
    res.status(201).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await eventsService.update(req.params.id, req.body, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ status: "error", message: "Falta el campo status" });
    }
    const event = await eventsService.updateStatus(req.params.id, status, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const event = await eventsService.cancel(req.params.id, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};
