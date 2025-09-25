// src/routes/economicCalendarRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { EconomicCalendarController } from "../controllers/EconomicCalendarController";
import { EconomicCalendarService } from "../services/EconomicCalendarService";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const economicCalendarService = new EconomicCalendarService();
const economicCalendarController = new EconomicCalendarController(
  economicCalendarService,
);

const bind = (
  method: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => asyncHandler(method.bind(economicCalendarController));

// --- Calendar Endpoints ---
router.get("/", bind(economicCalendarController.getEconomicCalendar));
router.get("/upcoming", bind(economicCalendarController.getUpcomingEvents));
router.get("/today", bind(economicCalendarController.getTodayEvents));
router.get("/events/:id", bind(economicCalendarController.getEventById));

// --- Alert Endpoints ---
router.post("/alerts", bind(economicCalendarController.createAlert));
router.get("/alerts", bind(economicCalendarController.getUserAlerts));
router.delete("/alerts/:id", bind(economicCalendarController.deleteAlert));

// --- Analysis Endpoints ---
router.get(
  "/impact-analysis/:eventId",
  bind(economicCalendarController.getImpactAnalysis),
);

export default router;
