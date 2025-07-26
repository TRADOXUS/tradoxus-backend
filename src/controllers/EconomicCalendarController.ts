import { Request, Response } from "express";
import { EconomicCalendarService } from "../services/EconomicCalendarService";
import { AppError } from "../middleware/errorHandler";
import { 
  CreateAlertDto, 
  CalendarQueryDto, 
  UpcomingEventsDto 
} from "../dto/EconomicCalendarDto";
import { BaseController } from "./BaseController";
import { EconomicEvent } from "../entities/EconomicEvent";
import { validate, ValidationError } from "class-validator";

export class EconomicCalendarController extends BaseController<EconomicEvent> {
  constructor(private economicCalendarService: EconomicCalendarService) {
    super(EconomicEvent);
  }

  handleValidationErrors(errors: ValidationError[], res: Response) {
    const formattedErrors = errors.map((error) => {
      return {
        property: error.property,
        constraints: error.constraints,
      };
    });
    res.status(400).json({
      error: "Validation failed",
      details: formattedErrors,
    });
  }

  handleError(error: Error, res: Response) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }

  /**
   * Get economic calendar events with filters
   * @route GET /api/economic-calendar
   * @query startDate, endDate, countries[], importance[], currencies[]
   */
  getEconomicCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryDto = new CalendarQueryDto();
      Object.assign(queryDto, req.query);

      // Validate query parameters
      const errors = await validate(queryDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const events = await this.economicCalendarService.getFilteredEvents(queryDto);
      
      res.status(200).json({
        status: "success",
        data: {
          events,
          count: events.length,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get upcoming economic events
   * @route GET /api/economic-calendar/upcoming
   * @query hours (default: 24)
   */
  getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const upcomingDto = new UpcomingEventsDto();
      Object.assign(upcomingDto, req.query);

      // Validate query parameters
      const errors = await validate(upcomingDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const events = await this.economicCalendarService.getUpcomingEvents(
        upcomingDto.hours || 24
      );

      res.status(200).json({
        status: "success",
        data: {
          events,
          timeframe: `${upcomingDto.hours || 24} hours`,
          count: events.length,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get today's economic events
   * @route GET /api/economic-calendar/today
   */
  getTodayEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const events = await this.economicCalendarService.getTodayEvents();

      res.status(200).json({
        status: "success",
        data: {
          events,
          date: new Date().toISOString().split('T')[0],
          count: events.length,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Create a new event alert
   * @route POST /api/economic-calendar/alerts
   * @body { eventId, alertTimeBefore, userId }
   */
  createAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const createAlertDto = new CreateAlertDto();
      Object.assign(createAlertDto, req.body);

      // Validate DTO
      const errors = await validate(createAlertDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const alert = await this.economicCalendarService.createAlert(createAlertDto);

      res.status(201).json({
        status: "success",
        data: {
          alert: {
            alertId: alert.alertId,
            eventId: alert.eventId,
            userId: alert.userId,
            alertTimeBefore: alert.alertTimeBefore,
            isActive: alert.isActive,
            createdAt: alert.createdAt,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(400, error.message);
      }
      this.handleError(error, res);
    }
  };

  /**
   * Get user alerts
   * @route GET /api/economic-calendar/alerts
   * @query userId, isActive
   */
  getUserAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, isActive } = req.query;

      if (!userId) {
        res.status(400).json({
          error: "Validation failed",
          message: "userId is required",
        });
        return;
      }

      const alerts = await this.economicCalendarService.getUserAlerts(
        userId as string,
        isActive !== undefined ? isActive === 'true' : undefined
      );

      res.status(200).json({
        status: "success",
        data: {
          alerts,
          count: alerts.length,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Delete an alert
   * @route DELETE /api/economic-calendar/alerts/:id
   */
  deleteAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: "Validation failed",
          message: "Alert ID is required",
        });
        return;
      }

      const deleted = await this.economicCalendarService.deleteAlert(id);

      if (!deleted) {
        res.status(404).json({
          error: "Not Found",
          message: "Alert not found or already deleted",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Alert deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get impact analysis for a specific event
   * @route GET /api/economic-calendar/impact-analysis/:eventId
   */
  getImpactAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        res.status(400).json({
          error: "Validation failed",
          message: "Event ID is required",
        });
        return;
      }

      const analysis = await this.economicCalendarService.getImpactAnalysis(eventId);

      if (!analysis || analysis.length === 0) {
        res.status(404).json({
          error: "Not Found",
          message: "No impact analysis found for this event",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        data: {
          eventId,
          analysis,
          count: analysis.length,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get event details by ID (additional utility endpoint)
   * @route GET /api/economic-calendar/events/:id
   */
  getEventById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: "Validation failed",
          message: "Event ID is required",
        });
        return;
      }

      const event = await this.economicCalendarService.getEventById(id);

      if (!event) {
        res.status(404).json({
          error: "Not Found",
          message: "Event not found",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        data: {
          event,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}