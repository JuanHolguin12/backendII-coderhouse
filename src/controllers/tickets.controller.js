import { ticketsService } from "../services/tickets.service.js";

export const createTicket = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const { quantity } = req.body;
    const ticket = await ticketsService.createTicket({ eventId: eid, quantity }, req.user);
    res.status(201).json({ status: "success", payload: ticket });
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const ticket = await ticketsService.cancelTicket(tid, req.user);
    res.status(200).json({ status: "success", payload: ticket });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const tickets = await ticketsService.getEventTickets(eid, req.user);
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ticketsService.getMyTickets(req.user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ status: "success", payload: result });
  } catch (error) {
    next(error);
  }
};
