import { eventsService } from "../services/events.service.js";

export const getEvents = async (req, res) => {
  try {
    const events = await eventsService.getPublished();
    res.status(200).json({ status: "success", payload: events });
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

export const cancelEvent = async (req, res) => {
  try {
    const event = await eventsService.cancel(req.params.id, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};
