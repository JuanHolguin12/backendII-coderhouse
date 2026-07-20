import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
} from "../controllers/events.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", auth, authorize("organizer", "admin"), createEvent);
router.put("/:id", auth, authorize("organizer", "admin"), updateEvent);
router.delete("/:id", auth, authorize("organizer", "admin"), cancelEvent);

export default router;
