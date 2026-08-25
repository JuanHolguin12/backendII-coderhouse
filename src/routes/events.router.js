import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  cancelEvent,
} from "../controllers/events.controller.js";
import {
  createTicket,
  getEventTickets,
} from "../controllers/tickets.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", auth, authorize("organizer", "admin"), createEvent);
router.put("/:id", auth, authorize("organizer", "admin"), updateEvent);
router.patch("/:id/status", auth, authorize("organizer", "admin"), updateEventStatus);
router.delete("/:id", auth, authorize("organizer", "admin"), cancelEvent);

router.post("/:eid/tickets", auth, createTicket);
router.get("/:eid/tickets", auth, authorize("organizer", "admin"), getEventTickets);

export default router;
