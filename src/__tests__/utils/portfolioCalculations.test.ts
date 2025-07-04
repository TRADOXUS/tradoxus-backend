import {
  calculateTotals,
  calculateAssetPnL,
  calculateFIFOCostBasis,
  calculatePerformanceMetrics,
  calculateSharpeRatio,
  calculateDiversificationScore,
  type NumericBalance,
  type NumericTransaction,
} from "../../utils/portfolioCalculations";

describe("Portfolio Calculations", () => {
  describe("calculateTotals", () => {
    it("should calculate portfolio totals correctly", () => {
      const balances: NumericBalance[] = [
        {
          asset: "BTC",
          available: 1.0,
          locked: 0.0,
          total: 1.0,
          averageCost: 40000,
          unrealizedPnL: null,
          realizedPnL: 1000,
        },
        {
          asset: "ETH",
          available: 10.0,
          locked: 0.0,
          total: 10.0,
          averageCost: 2500,
          unrealizedPnL: null,
          realizedPnL: 500,
        },
      ];

      const prices = { BTC: 45000, ETH: 3000 };

      const result = calculateTotals(balances, prices);

      expect(result.totalValue).toBe(75000); // 45000 + 30000
      expect(result.totalPnL).toBe(11500); // (45000-40000) + (30000-25000) + 1000 + 500
      expect(result.allocation).toHaveLength(2);
      expect(result.allocation[0].asset).toBe("BTC");
      expect(result.allocation[0].percentage).toBeCloseTo(60); // 45000/75000 * 100
    });

    it("should handle empty balances", () => {
      const result = calculateTotals([], {});

      expect(result.totalValue).toBe(0);
      expect(result.totalPnL).toBe(0);
      expect(result.allocation).toHaveLength(0);
    });

    it("should filter out zero balances", () => {
      const balances: NumericBalance[] = [
        {
          asset: "BTC",
          available: 1.0,
          locked: 0.0,
          total: 1.0,
          averageCost: 40000,
          unrealizedPnL: null,
          realizedPnL: null,
        },
        {
          asset: "ETH",
          available: 0.0,
          locked: 0.0,
          total: 0.0,
          averageCost: null,
          unrealizedPnL: null,
          realizedPnL: null,
        },
      ];

      const prices = { BTC: 45000, ETH: 3000 };
      const result = calculateTotals(balances, prices);

      expect(result.allocation).toHaveLength(1);
      expect(result.allocation[0].asset).toBe("BTC");
    });
  });

  describe("calculateAssetPnL", () => {
    it("should calculate asset P&L correctly", () => {
      const balance: NumericBalance = {
        asset: "BTC",
        available: 1.0,
        locked: 0.0,
        total: 1.0,
        averageCost: 40000,
        unrealizedPnL: null,
        realizedPnL: 1000,
      };

      const result = calculateAssetPnL(balance, 45000);

      expect(result.currentValue).toBe(45000);
      expect(result.unrealizedPnL).toBe(5000); // 45000 - 40000
      expect(result.realizedPnL).toBe(1000);
      expect(result.totalPnL).toBe(6000); // 5000 + 1000
    });

    it("should handle null average cost", () => {
      const balance: NumericBalance = {
        asset: "BTC",
        available: 1.0,
        locked: 0.0,
        total: 1.0,
        averageCost: null,
        unrealizedPnL: null,
        realizedPnL: 500,
      };

      const result = calculateAssetPnL(balance, 45000);

      expect(result.currentValue).toBe(45000);
      expect(result.unrealizedPnL).toBeNull();
      expect(result.realizedPnL).toBe(500);
      expect(result.totalPnL).toBe(500);
    });
  });

  describe("calculateFIFOCostBasis", () => {
    it("should calculate FIFO cost basis correctly", () => {
      const transactions: NumericTransaction[] = [
        {
          type: "BUY",
          asset: "BTC",
          amount: 1.0,
          price: 40000,
          fee: 10,
          totalValue: null,
          createdAt: new Date("2023-01-01"),
        },
        {
          type: "BUY",
          asset: "BTC",
          amount: 1.0,
          price: 50000,
          fee: 10,
          totalValue: null,
          createdAt: new Date("2023-01-02"),
        },
        {
          type: "SELL",
          asset: "BTC",
          amount: 0.5,
          price: 60000,
          fee: 5,
          totalValue: null,
          createdAt: new Date("2023-01-03"),
        },
      ];

      const result = calculateFIFOCostBasis(transactions);

      expect(result.remainingQuantity).toBe(1.5);
      expect(result.averageCost).toBeCloseTo(43333.33, 2); // (40000*0.5 + 50000*1) / 1.5
      expect(result.realizedPnL).toBe(10000); // (60000 - 40000) * 0.5
    });

    it("should handle complex transaction sequences", () => {
      const transactions: NumericTransaction[] = [
        {
          type: "BUY",
          asset: "ETH",
          amount: 10,
          price: 2000,
          fee: null,
          totalValue: null,
          createdAt: new Date("2023-01-01"),
        },
        {
          type: "SELL",
          asset: "ETH",
          amount: 5,
          price: 2500,
          fee: null,
          totalValue: null,
          createdAt: new Date("2023-01-02"),
        },
        {
          type: "BUY",
          asset: "ETH",
          amount: 5,
          price: 3000,
          fee: null,
          totalValue: null,
          createdAt: new Date("2023-01-03"),
        },
      ];

      const result = calculateFIFOCostBasis(transactions);

      expect(result.remainingQuantity).toBe(10);
      expect(result.averageCost).toBe(2500); // (2000*5 + 3000*5) / 10
      expect(result.realizedPnL).toBe(2500); // (2500 - 2000) * 5
    });

    it("should handle deposits and withdrawals", () => {
      const transactions: NumericTransaction[] = [
        {
          type: "DEPOSIT",
          asset: "USDC",
          amount: 1000,
          price: 1,
          fee: null,
          totalValue: null,
          createdAt: new Date("2023-01-01"),
        },
        {
          type: "WITHDRAWAL",
          asset: "USDC",
          amount: 500,
          price: 1,
          fee: null,
          totalValue: null,
          createdAt: new Date("2023-01-02"),
        },
      ];

      const result = calculateFIFOCostBasis(transactions);

      expect(result.remainingQuantity).toBe(500);
      expect(result.averageCost).toBe(1);
      expect(result.realizedPnL).toBe(0); // No gain/loss on stablecoin
    });
  });

  describe("calculatePerformanceMetrics", () => {
    it("should calculate performance metrics correctly", () => {
      const result = calculatePerformanceMetrics(110000, 100000, "day");

      expect(result.absoluteChange).toBe(10000);
      expect(result.percentageChange).toBe(10);
    });

    it("should handle zero previous value", () => {
      const result = calculatePerformanceMetrics(50000, 0, "day");

      expect(result.absoluteChange).toBe(50000);
      expect(result.percentageChange).toBe(0);
    });

    it("should handle negative performance", () => {
      const result = calculatePerformanceMetrics(90000, 100000, "day");

      expect(result.absoluteChange).toBe(-10000);
      expect(result.percentageChange).toBe(-10);
    });
  });

  describe("calculateSharpeRatio", () => {
    it("should calculate Sharpe ratio correctly", () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.005, -0.015, 0.025];
      const result = calculateSharpeRatio(returns, 0.02);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(5); // Reasonable range for Sharpe ratio
    });

    it("should handle empty returns array", () => {
      const result = calculateSharpeRatio([]);

      expect(result).toBe(0);
    });

    it("should handle single return", () => {
      const result = calculateSharpeRatio([0.05]);

      expect(result).toBe(0);
    });

    it("should handle zero volatility", () => {
      const returns = [0.01, 0.01, 0.01, 0.01]; // No volatility
      const result = calculateSharpeRatio(returns);

      expect(result).toBe(0);
    });
  });

  describe("calculateDiversificationScore", () => {
    it("should calculate diversification score for balanced portfolio", () => {
      const allocation = [
        { asset: "BTC", value: 25000, percentage: 25, color: "#f59e0b" },
        { asset: "ETH", value: 25000, percentage: 25, color: "#8b5cf6" },
        { asset: "ADA", value: 25000, percentage: 25, color: "#06b6d4" },
        { asset: "XLM", value: 25000, percentage: 25, color: "#14b8a6" },
      ];

      const result = calculateDiversificationScore(allocation);

      expect(result).toBeCloseTo(100, 0); // Perfectly diversified
    });

    it("should calculate diversification score for concentrated portfolio", () => {
      const allocation = [
        { asset: "BTC", value: 90000, percentage: 90, color: "#f59e0b" },
        { asset: "ETH", value: 10000, percentage: 10, color: "#8b5cf6" },
      ];

      const result = calculateDiversificationScore(allocation);

      expect(result).toBeLessThan(50); // Poorly diversified
    });

    it("should handle single asset portfolio", () => {
      const allocation = [
        { asset: "BTC", value: 100000, percentage: 100, color: "#f59e0b" },
      ];

      const result = calculateDiversificationScore(allocation);

      expect(result).toBe(0); // No diversification
    });

    it("should handle empty allocation", () => {
      const result = calculateDiversificationScore([]);

      expect(result).toBe(0);
    });
  });
});
