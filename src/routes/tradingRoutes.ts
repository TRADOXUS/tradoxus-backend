import { Router, Request, Response } from "express";
import { TradingController } from "../controllers/TradingController";
import { TradingService } from "../services/TradingService";

const router = Router();

// Initialize service and controller
const tradingService = new TradingService();
const tradingController = new TradingController(tradingService);

// Trading endpoints
router.post("/orders", (req: Request, res: Response) =>
  tradingController.createOrder(req, res),
);
router.get("/orders/user/:userId", (req: Request, res: Response) =>
  tradingController.getUserOrders(req, res),
);
router.get("/market/ticker", (req: Request, res: Response) =>
  tradingController.getMarketTicker(req, res),
);
router.get("/market/orderbook/:symbol", (req: Request, res: Response) =>
  tradingController.getOrderBook(req, res),
);

export default router;
