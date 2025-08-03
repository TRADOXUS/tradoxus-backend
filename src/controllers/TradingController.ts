import { Request, Response } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { BaseController } from "./BaseController";
import { TradingService } from "../services/TradingService";
import {
  CreateOrderDto,
  GetUserOrdersDto,
  GetOrderBookDto,
} from "../dto/TradingDto";

export class TradingController extends BaseController {
  private tradingService: TradingService;

  constructor(tradingService: TradingService) {
    super();
    this.tradingService = tradingService;
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderDto = plainToClass(CreateOrderDto, req.body);
      const errors = await validate(orderDto);

      if (errors.length > 0) {
        this.sendValidationError(res, errors);
        return;
      }

      const order = await this.tradingService.createOrder(orderDto);
      this.sendSuccess(res, order, "Order created successfully", 201);
    } catch (error) {
      this.logger.error("Error in createOrder:", error);
      this.sendError(res, "Failed to create order", 500);
    }
  }

  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const queryDto = plainToClass(GetUserOrdersDto, {
        userId,
        ...req.query,
      });

      const errors = await validate(queryDto);
      if (errors.length > 0) {
        this.sendValidationError(res, errors);
        return;
      }

      const orders = await this.tradingService.getUserOrders(queryDto);
      this.sendSuccess(res, orders, "Orders retrieved successfully");
    } catch (error) {
      this.logger.error("Error in getUserOrders:", error);
      this.sendError(res, "Failed to retrieve orders", 500);
    }
  }

  async getMarketTicker(req: Request, res: Response): Promise<void> {
    try {
      const tickers = await this.tradingService.getMarketTicker();
      this.sendSuccess(res, tickers, "Market data retrieved successfully");
    } catch (error) {
      this.logger.error("Error in getMarketTicker:", error);
      this.sendError(res, "Failed to retrieve market data", 500);
    }
  }

  async getOrderBook(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const queryDto = plainToClass(GetOrderBookDto, {
        symbol,
        ...req.query,
      });

      const errors = await validate(queryDto);
      if (errors.length > 0) {
        this.sendValidationError(res, errors);
        return;
      }

      const orderbook = await this.tradingService.getOrderBook(
        queryDto.symbol,
        queryDto.depth,
      );

      this.sendSuccess(res, orderbook, "Orderbook retrieved successfully");
    } catch (error) {
      this.logger.error("Error in getOrderBook:", error);
      this.sendError(res, "Failed to retrieve orderbook", 500);
    }
  }
}
