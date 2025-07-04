import { Repository, EntityManager } from "typeorm";
import { AppDataSource } from "../config/database";
import { Balance } from "../entities/Balance";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "../entities/Transaction";
import { BaseService } from "./BaseService";
import { redisClient } from "../config/redis";
import {
  PortfolioSummaryDto,
  AssetBalanceDto,
  TransactionDto,
  PortfolioPerformanceDto,
  PortfolioHistoryDto,
} from "../dto/PortfolioDto";
import {
  calculateTotals,
  calculateAssetPnL,
  calculateFIFOCostBasis,
  calculatePerformanceMetrics,
  calculateSharpeRatio,
  calculateDiversificationScore,
} from "../utils/portfolioCalculations";
import Decimal from "decimal.js";

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export class PortfolioService extends BaseService<Balance> {
  private balanceRepository: Repository<Balance>;
  private transactionRepository: Repository<Transaction>;

  constructor() {
    super(Balance);
    this.balanceRepository = AppDataSource.getRepository(Balance);
    this.transactionRepository = AppDataSource.getRepository(Transaction);
  }

  async getPortfolioSummary(userId: string): Promise<PortfolioSummaryDto> {
    const cacheKey = `portfolio:summary:${userId}`;

    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const balances = await this.getBalances(userId);
    const prices = await this.getCurrentPrices(balances.map((b) => b.asset));

    const summary = calculateTotals(
      balances.map((b) => ({
        ...b,
        available: Number.parseFloat(b.available),
        locked: Number.parseFloat(b.locked),
        total: Number.parseFloat(b.total),
        averageCost: b.averageCost ? Number.parseFloat(b.averageCost) : null,
        unrealizedPnL: b.unrealizedPnL
          ? Number.parseFloat(b.unrealizedPnL)
          : null,
        realizedPnL: b.realizedPnL ? Number.parseFloat(b.realizedPnL) : null,
      })),
      prices,
    );

    // Calculate additional metrics
    const returns = await this.calculateReturns(userId, "day", 30);

    const portfolioSummary: PortfolioSummaryDto = {
      ...summary,
      diversificationScore: calculateDiversificationScore(summary.allocation),
      sharpeRatio:
        returns.length > 0 ? calculateSharpeRatio(returns) : undefined,
      maxDrawdown: undefined, // Will be calculated from historical data
      cagr: undefined, // Will be calculated from historical data
    };

    // Cache for 30 seconds
    await redisClient.setEx(cacheKey, 30, JSON.stringify(portfolioSummary));

    return portfolioSummary;
  }

  async getAssetBalances(userId: string): Promise<AssetBalanceDto[]> {
    const balances = await this.getBalances(userId);
    const prices = await this.getCurrentPrices(balances.map((b) => b.asset));

    return balances.map((balance) => {
      const numericBalance = {
        ...balance,
        available: Number.parseFloat(balance.available),
        locked: Number.parseFloat(balance.locked),
        total: Number.parseFloat(balance.total),
        averageCost: balance.averageCost
          ? Number.parseFloat(balance.averageCost)
          : null,
        unrealizedPnL: balance.unrealizedPnL
          ? Number.parseFloat(balance.unrealizedPnL)
          : null,
        realizedPnL: balance.realizedPnL
          ? Number.parseFloat(balance.realizedPnL)
          : null,
      };

      const currentPrice = prices[balance.asset] || 0;
      const pnl = calculateAssetPnL(numericBalance, currentPrice);

      return {
        asset: balance.asset,
        available: numericBalance.available,
        locked: numericBalance.locked,
        total: numericBalance.total,
        currentValue: pnl.currentValue,
        averageCost:
          numericBalance.averageCost !== null
            ? numericBalance.averageCost
            : undefined,
        unrealizedPnL:
          pnl.unrealizedPnL !== null ? pnl.unrealizedPnL : undefined,
        realizedPnL: pnl.realizedPnL !== null ? pnl.realizedPnL : undefined,
        totalPnL: pnl.totalPnL !== null ? pnl.totalPnL : undefined,
        currentPrice,
      };
    });
  }

  async getTransactionHistory(
    userId: string,
    limit = 50,
    offset = 0,
    asset?: string,
  ): Promise<{ transactions: TransactionDto[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder("transaction")
      .where("transaction.userId = :userId", { userId })
      .orderBy("transaction.createdAt", "DESC");

    if (asset) {
      queryBuilder.andWhere("transaction.asset = :asset", { asset });
    }

    const [transactions, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const transactionDtos: TransactionDto[] = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      asset: tx.asset,
      amount: Number.parseFloat(tx.amount),
      price: tx.price ? Number.parseFloat(tx.price) : undefined,
      fee: tx.fee ? Number.parseFloat(tx.fee) : undefined,
      totalValue: tx.totalValue ? Number.parseFloat(tx.totalValue) : undefined,
      txHash: tx.txHash || undefined,
      description: tx.description || undefined,
      createdAt: tx.createdAt,
    }));

    return { transactions: transactionDtos, total };
  }

  async getPortfolioPerformance(
    userId: string,
    period: "day" | "week" | "month" | "year",
  ): Promise<PortfolioPerformanceDto> {
    const currentValue = await this.getCurrentPortfolioValue(userId);
    const previousValue = await this.getHistoricalPortfolioValue(
      userId,
      period,
    );

    const performance = calculatePerformanceMetrics(
      currentValue,
      previousValue,
      period,
    );

    return {
      currentValue,
      previousValue,
      ...performance,
      period,
    };
  }

  async getPortfolioHistory(
    userId: string,
    period: "day" | "week" | "month" | "year",
    points = 30,
  ): Promise<PortfolioHistoryDto> {
    // This would typically query historical snapshots
    // For now, we'll simulate with recent transaction data
    const transactions = await this.getRecentTransactions(userId, points * 10);

    // Group transactions by time periods and calculate portfolio value at each point
    const timestamps: Date[] = [];
    const values: number[] = [];

    // Simplified implementation - in production, you'd have portfolio snapshots
    let runningValue = 0;
    const groupedTx = this.groupTransactionsByPeriod(
      transactions,
      period,
      points,
    );

    for (const [timestamp, txGroup] of groupedTx) {
      timestamps.push(timestamp);
      // Calculate portfolio value at this point in time
      runningValue += txGroup.reduce((sum, tx) => {
        const amount = Number.parseFloat(tx.amount);
        const price = tx.price ? Number.parseFloat(tx.price) : 0;
        return (
          sum +
          (tx.type === TransactionType.BUY ? amount * price : -amount * price)
        );
      }, 0);
      values.push(runningValue);
    }

    const returns = this.calculateReturnsFromValues(values);
    const totalReturn =
      values.length > 1
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : 0;
    const volatility = this.calculateVolatility(returns);

    return {
      timestamps,
      values,
      period,
      totalReturn,
      volatility,
    };
  }

  async updateBalance(
    userId: string,
    asset: string,
    transaction: Transaction,
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let balance = await queryRunner.manager.findOne(Balance, {
        where: { userId, asset },
      });

      if (!balance) {
        balance = new Balance();
        balance.userId = userId;
        balance.asset = asset;
        balance.available = "0";
        balance.locked = "0";
        balance.total = "0";
        balance.averageCost = null;
        balance.unrealizedPnL = null;
        balance.realizedPnL = null;
      }

      // Update balance based on transaction type
      const amount = new Decimal(transaction.amount);
      const currentAvailable = new Decimal(balance.available);
      const currentTotal = new Decimal(balance.total);

      switch (transaction.type) {
        case TransactionType.BUY:
        case TransactionType.DEPOSIT:
        case TransactionType.TRANSFER_IN:
        case TransactionType.REWARD:
          balance.available = currentAvailable.plus(amount).toString();
          balance.total = currentTotal.plus(amount).toString();
          break;

        case TransactionType.SELL:
        case TransactionType.WITHDRAWAL:
        case TransactionType.TRANSFER_OUT:
        case TransactionType.FEE:
          balance.available = currentAvailable.minus(amount).toString();
          balance.total = currentTotal.minus(amount).toString();
          break;
      }

      // Recalculate cost basis and P&L
      await this.recalculateCostBasis(userId, asset, queryRunner.manager);

      await queryRunner.manager.save(balance);
      await queryRunner.commitTransaction();

      // Invalidate cache
      await redisClient.del(`portfolio:summary:${userId}`);
      await redisClient.del(`balances:${userId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getBalances(userId: string): Promise<Balance[]> {
    const cacheKey = `balances:${userId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const balances = await this.balanceRepository.find({
      where: { userId },
      order: { asset: "ASC" },
    });

    await redisClient.setEx(cacheKey, 60, JSON.stringify(balances));
    return balances;
  }

  private async getCurrentPrices(
    assets: string[],
  ): Promise<Record<string, number>> {
    // This would integrate with external price APIs
    // For now, return mock prices
    const prices: Record<string, number> = {};

    for (const asset of assets) {
      const cacheKey = `price:${asset}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        prices[asset] = Number.parseFloat(cached);
      } else {
        // Mock price - in production, fetch from external API
        const mockPrice = this.getMockPrice(asset);
        prices[asset] = mockPrice;
        await redisClient.setEx(cacheKey, 30, mockPrice.toString());
      }
    }

    return prices;
  }

  private getMockPrice(asset: string): number {
    const mockPrices: Record<string, number> = {
      XLM: 0.12,
      USDC: 1.0,
      BTC: 45000,
      ETH: 3000,
    };
    return mockPrices[asset] || 1.0;
  }

  private async getRecentTransactions(
    userId: string,
    limit: number,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId, status: TransactionStatus.COMPLETED },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  private async getCurrentPortfolioValue(userId: string): Promise<number> {
    const summary = await this.getPortfolioSummary(userId);
    return summary.totalValue;
  }

  private async getHistoricalPortfolioValue(
    userId: string,
    period: "day" | "week" | "month" | "year",
  ): Promise<number> {
    // This would query historical snapshots
    // For now, simulate based on recent transactions
    const daysBack =
      period === "day"
        ? 1
        : period === "week"
          ? 7
          : period === "month"
            ? 30
            : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const transactions = await this.transactionRepository.find({
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
      },
      order: { createdAt: "ASC" },
    });

    // Filter transactions before cutoff date
    const historicalTransactions = transactions.filter(
      (tx) => tx.createdAt <= cutoffDate,
    );

    // Simplified calculation - in production, use portfolio snapshots
    return historicalTransactions.reduce((sum, tx) => {
      const value = tx.totalValue ? Number.parseFloat(tx.totalValue) : 0;
      return tx.type === TransactionType.BUY ? sum + value : sum - value;
    }, 0);
  }

  private async calculateReturns(
    userId: string,
    period: "day" | "week" | "month" | "year",
    points: number,
  ): Promise<number[]> {
    const history = await this.getPortfolioHistory(userId, period, points);
    return this.calculateReturnsFromValues(history.values);
  }

  private calculateReturnsFromValues(values: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private groupTransactionsByPeriod(
    transactions: Transaction[],
    period: "day" | "week" | "month" | "year",
    points: number,
  ): Map<Date, Transaction[]> {
    const grouped = new Map<Date, Transaction[]>();

    // Simplified grouping logic
    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      // Round date based on period
      const key = this.roundDateToPeriod(date, period);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(tx);
    });

    return grouped;
  }

  private roundDateToPeriod(
    date: Date,
    period: "day" | "week" | "month" | "year",
  ): Date {
    const rounded = new Date(date);

    switch (period) {
      case "day":
        rounded.setHours(0, 0, 0, 0);
        break;
      case "week":
        rounded.setDate(rounded.getDate() - rounded.getDay());
        rounded.setHours(0, 0, 0, 0);
        break;
      case "month":
        rounded.setDate(1);
        rounded.setHours(0, 0, 0, 0);
        break;
      case "year":
        rounded.setMonth(0, 1);
        rounded.setHours(0, 0, 0, 0);
        break;
    }

    return rounded;
  }

  private async recalculateCostBasis(
    userId: string,
    asset: string,
    manager: EntityManager,
  ): Promise<void> {
    const transactions = await manager.find(Transaction, {
      where: { userId, asset, status: TransactionStatus.COMPLETED },
      order: { createdAt: "ASC" },
    });

    const numericTransactions = transactions.map((tx: Transaction) => ({
      ...tx,
      amount: Number.parseFloat(tx.amount),
      price: tx.price ? Number.parseFloat(tx.price) : null,
      fee: tx.fee ? Number.parseFloat(tx.fee) : null,
      totalValue: tx.totalValue ? Number.parseFloat(tx.totalValue) : null,
    }));

    const costBasis = calculateFIFOCostBasis(numericTransactions);

    await manager.update(
      Balance,
      { userId, asset },
      {
        averageCost: costBasis.averageCost.toString(),
        realizedPnL: costBasis.realizedPnL.toString(),
      },
    );
  }
}
