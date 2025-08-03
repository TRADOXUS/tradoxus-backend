import {
  CreateOrderDto,
  OrderResponseDto,
  GetUserOrdersDto,
  MarketTickerDto,
  OrderBookDto,
  OrderStatus,
  OrderType,
} from "../dto/TradingDto";

export class TradingService {
  private logger = {
    error: (message: string, error?: any) => {
      console.error(`[TradingService] ${message}`, error);
    },
    info: (message: string) => {
      console.log(`[TradingService] ${message}`);
    },
  };

  constructor() {
  }

  async createOrder(orderData: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      // Input validation
      if (!orderData.symbol || orderData.symbol.trim() === "") {
        throw new Error("Symbol is required and cannot be empty");
      }
      
      if (orderData.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      
      if (orderData.price <= 0) {
        throw new Error("Price must be greater than 0");
      }
      
      if (!orderData.userId || orderData.userId.trim() === "") {
        throw new Error("User ID is required and cannot be empty");
      }
      
      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderData.userId)) {
        throw new Error("Invalid user ID format");
      }

      // Mock order creation - replace with actual exchange integration
      const orderId = this.generateOrderId();

      const order: OrderResponseDto = {
        id: orderId,
        symbol: orderData.symbol,
        type: orderData.type,
        amount: orderData.amount,
        price: orderData.price,
        status: OrderStatus.PENDING,
        userId: orderData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simulate order processing
      setTimeout(() => {
        this.processOrder(orderId);
      }, 1000);

      return order;
    } catch (error) {
      this.logger.error("Error creating order:", error);
      throw error; // Re-throw the original error instead of generic message
    }
  }

  async getUserOrders(params: GetUserOrdersDto): Promise<OrderResponseDto[]> {
    try {
      // Mock user orders - replace with actual database query
      const mockOrders: OrderResponseDto[] = [
        {
          id: "order_1",
          symbol: "BTC/USD",
          type: OrderType.BUY,
          amount: 0.1,
          price: 45000,
          status: OrderStatus.FILLED,
          userId: params.userId,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          filledAmount: 0.1,
          filledPrice: 44950,
        },
        {
          id: "order_2",
          symbol: "ETH/USD",
          type: OrderType.SELL,
          amount: 2.5,
          price: 3200,
          status: OrderStatus.PENDING,
          userId: params.userId,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
      ];

      // Apply filters
      let filteredOrders = mockOrders.filter(
        (order) => order.userId === params.userId,
      );

      if (params.status) {
        filteredOrders = filteredOrders.filter(
          (order) => order.status === params.status,
        );
      }

      if (params.symbol) {
        filteredOrders = filteredOrders.filter(
          (order) => order.symbol === params.symbol,
        );
      }

      // Apply pagination
      const offset = params.offset || 0;
      const limit = params.limit || 50;

      return filteredOrders.slice(offset, offset + limit);
    } catch (error) {
      this.logger.error("Error fetching user orders:", error);
      throw new Error("Failed to fetch user orders");
    }
  }

  async getMarketTicker(): Promise<MarketTickerDto[]> {
    try {
      // Mock market data - replace with actual exchange API integration
      const mockTickers: MarketTickerDto[] = [
        {
          symbol: "BTC/USD",
          price: 45250.5,
          change24h: 1250.3,
          changePercent24h: 2.84,
          volume24h: 1234567890,
          high24h: 46000,
          low24h: 43800,
          timestamp: new Date(),
        },
        {
          symbol: "ETH/USD",
          price: 3180.75,
          change24h: -45.25,
          changePercent24h: -1.4,
          volume24h: 987654321,
          high24h: 3250,
          low24h: 3150,
          timestamp: new Date(),
        },
        {
          symbol: "ADA/USD",
          price: 0.485,
          change24h: 0.025,
          changePercent24h: 5.43,
          volume24h: 456789123,
          high24h: 0.495,
          low24h: 0.46,
          timestamp: new Date(),
        },
      ];

      return mockTickers;
    } catch (error) {
      this.logger.error("Error fetching market ticker:", error);
      throw new Error("Failed to fetch market data");
    }
  }

  async getOrderBook(
    symbol: string,
    depth: number = 20,
  ): Promise<OrderBookDto> {
    try {
      // Mock orderbook data - replace with actual exchange API integration
      const bids = Array.from({ length: depth }, (_, i) => ({
        price: 45000 - i * 10,
        amount: Math.random() * 5,
        total: 0,
      }));

      const asks = Array.from({ length: depth }, (_, i) => ({
        price: 45010 + i * 10,
        amount: Math.random() * 5,
        total: 0,
      }));

      // Calculate totals
      let bidTotal = 0;
      let askTotal = 0;

      bids.forEach((bid) => {
        bidTotal += bid.amount;
        bid.total = bidTotal;
      });

      asks.forEach((ask) => {
        askTotal += ask.amount;
        ask.total = askTotal;
      });

      return {
        symbol,
        bids,
        asks,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error("Error fetching orderbook:", error);
      throw new Error("Failed to fetch orderbook data");
    }
  }

  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processOrder(orderId: string): Promise<void> {
    // Mock order processing logic
    // In a real implementation, this would interact with exchange APIs
    this.logger.info(`Processing order ${orderId}`);
  }
}
