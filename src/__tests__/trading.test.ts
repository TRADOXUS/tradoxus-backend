import request from 'supertest';
import { TradingService } from '../services/TradingService';
import { TradingController } from '../controllers/TradingController';
import { OrderType, OrderStatus } from '../dto/TradingDto';

describe('TradingService', () => {
  let tradingService: TradingService;

  beforeEach(() => {
    tradingService = new TradingService();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        symbol: 'BTC/USD',
        type: OrderType.BUY,
        amount: 0.1,
        price: 45000,
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = await tradingService.createOrder(orderData);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(orderData.symbol);
      expect(result.type).toBe(orderData.type);
      expect(result.amount).toBe(orderData.amount);
      expect(result.price).toBe(orderData.price);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.userId).toBe(orderData.userId);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle errors when creating order fails', async () => {
      const invalidOrderData = {
        symbol: '',
        type: OrderType.BUY,
        amount: -1,
        price: 0,
        userId: 'invalid-uuid'
      };

      await expect(tradingService.createOrder(invalidOrderData)).rejects.toThrow();
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders with pagination', async () => {
      const params = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        limit: 10,
        offset: 0
      };

      const result = await tradingService.getUserOrders(params);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(params.limit);
      result.forEach(order => {
        expect(order.userId).toBe(params.userId);
        expect(order.id).toBeDefined();
        expect(order.symbol).toBeDefined();
        expect(order.type).toBeDefined();
        expect(order.status).toBeDefined();
      });
    });

    it('should filter orders by status', async () => {
      const params = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.FILLED
      };

      const result = await tradingService.getUserOrders(params);

      result.forEach(order => {
        expect(order.status).toBe(OrderStatus.FILLED);
      });
    });
  });

  describe('getMarketTicker', () => {
    it('should return market ticker data', async () => {
      const result = await tradingService.getMarketTicker();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(ticker => {
        expect(ticker.symbol).toBeDefined();
        expect(ticker.price).toBeDefined();
        expect(ticker.change24h).toBeDefined();
        expect(ticker.changePercent24h).toBeDefined();
        expect(ticker.volume24h).toBeDefined();
        expect(ticker.high24h).toBeDefined();
        expect(ticker.low24h).toBeDefined();
        expect(ticker.timestamp).toBeDefined();
      });
    });
  });

  describe('getOrderBook', () => {
    it('should return orderbook data for a symbol', async () => {
      const symbol = 'BTC/USD';
      const depth = 10;

      const result = await tradingService.getOrderBook(symbol, depth);

      expect(result.symbol).toBe(symbol);
      expect(Array.isArray(result.bids)).toBe(true);
      expect(Array.isArray(result.asks)).toBe(true);
      expect(result.bids.length).toBeLessThanOrEqual(depth);
      expect(result.asks.length).toBeLessThanOrEqual(depth);
      expect(result.timestamp).toBeDefined();

      result.bids.forEach(bid => {
        expect(bid.price).toBeDefined();
        expect(bid.amount).toBeDefined();
        expect(bid.total).toBeDefined();
      });

      result.asks.forEach(ask => {
        expect(ask.price).toBeDefined();
        expect(ask.amount).toBeDefined();
        expect(ask.total).toBeDefined();
      });
    });
  });
});

describe('TradingController', () => {
  let tradingController: TradingController;
  let tradingService: TradingService;

  beforeEach(() => {
    tradingService = new TradingService();
    tradingController = new TradingController(tradingService);
  });

  describe('createOrder', () => {
    it('should handle valid order creation request', async () => {
      const mockReq = {
        body: {
          symbol: 'BTC/USD',
          type: 'buy',
          amount: '0.1',
          price: '45000',
          userId: '123e4567-e89b-12d3-a456-426614174000'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await tradingController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockReq = {
        body: {
          symbol: '',
          type: 'invalid',
          amount: 'invalid',
          price: 'invalid',
          userId: 'invalid'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      await tradingController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
