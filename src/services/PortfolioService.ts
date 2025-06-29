import { Repository } from "typeorm"
import { Transaction, TransactionStatus, TransactionType } from "../entities/Transaction"
import { Balance } from "../entities/Balance"
import { User } from "../entities/User"
import { AppError } from "../utils/AppError"
import { redisClient } from "../config/redis"
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  PortfolioQueryDto,
  AssetBalance,
  PortfolioSummary,
  TransactionSummary,
  PortfolioResponse,
} from "../dto/PortfolioDto"

export class PortfolioService {
  constructor(
    private transactionRepository: Repository<Transaction>,
    private balanceRepository: Repository<Balance>,
    private userRepository: Repository<User>,
  ) {}

  async createTransaction(userId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new AppError("User not found", 404)
    }

    const transaction = this.transactionRepository.create({
      userId,
      ...createTransactionDto,
      amount: createTransactionDto.amount.toString(),
      price: createTransactionDto.price?.toString(),
      fee: createTransactionDto.fee?.toString(),
      metadata: createTransactionDto.metadata ? JSON.stringify(createTransactionDto.metadata) : undefined,
    })

    const savedTransaction = await this.transactionRepository.save(transaction)

    // Update balance if transaction is completed
    const tx: Transaction = Array.isArray(savedTransaction) ? savedTransaction[0] : savedTransaction
    if (tx.status === TransactionStatus.COMPLETED) {
      await this.updateBalance(userId, tx)
    }

    // Invalidate cache
    await this.invalidatePortfolioCache(userId)

    return tx
  }

  async updateTransaction(
    transactionId: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
    })

    if (!transaction) {
      throw new AppError("Transaction not found", 404)
    }

    const oldStatus = transaction.status
    Object.assign(transaction, {
      ...updateTransactionDto,
      metadata: updateTransactionDto.metadata ? JSON.stringify(updateTransactionDto.metadata) : transaction.metadata,
    })

    const updatedTransaction = await this.transactionRepository.save(transaction)

    // Update balance if status changed to completed
    if (oldStatus !== TransactionStatus.COMPLETED && updatedTransaction.status === TransactionStatus.COMPLETED) {
      await this.updateBalance(userId, updatedTransaction)
    }

    // Invalidate cache
    await this.invalidatePortfolioCache(userId)

    return updatedTransaction
  }

  async getPortfolio(userId: string, query: PortfolioQueryDto = {}): Promise<PortfolioResponse> {
    const cacheKey = `portfolio:${userId}:${JSON.stringify(query)}`

    try {
      const cached = await redisClient.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.warn("Redis cache read failed:", error)
    }

    const [balances, recentTransactions] = await Promise.all([
      this.getUserBalances(userId),
      this.getRecentTransactions(userId, query.limit || 10),
    ])

    const prices = await this.getCurrentPrices(balances.map((b) => b.asset))
    const summary = await this.calculatePortfolioSummary(balances, prices)

    const response: PortfolioResponse = {
      summary,
      recentTransactions,
      lastUpdated: new Date(),
    }

    // Cache for 10 seconds
    try {
      await redisClient.setEx(cacheKey, 10, JSON.stringify(response))
    } catch (error) {
      console.warn("Redis cache write failed:", error)
    }

    return response
  }

  async getUserBalances(userId: string): Promise<Balance[]> {
    return this.balanceRepository.find({
      where: { userId },
      order: { asset: "ASC" },
    })
  }

  async getRecentTransactions(userId: string, limit = 10): Promise<TransactionSummary[]> {
    const transactions = await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    })

    return transactions.map((tx) => ({
      id: tx.id,
      asset: tx.asset,
      type: tx.type,
      amount: Number.parseFloat(tx.amount),
      price: tx.price ? Number.parseFloat(tx.price) : null,
      fee: tx.fee ? Number.parseFloat(tx.fee) : null,
      status: tx.status,
      totalValue: tx.totalValue,
      createdAt: tx.createdAt,
      txHash: tx.txHash,
    }))
  }

  async getTransactionHistory(
    userId: string,
    query: PortfolioQueryDto,
  ): Promise<{ transactions: TransactionSummary[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder("transaction")
      .where("transaction.userId = :userId", { userId })

    if (query.asset) {
      queryBuilder.andWhere("transaction.asset = :asset", { asset: query.asset })
    }

    if (query.startDate) {
      queryBuilder.andWhere("transaction.createdAt >= :startDate", { startDate: query.startDate })
    }

    if (query.endDate) {
      queryBuilder.andWhere("transaction.createdAt <= :endDate", { endDate: query.endDate })
    }

    const total = await queryBuilder.getCount()

    const transactions = await queryBuilder
      .orderBy("transaction.createdAt", "DESC")
      .skip(query.offset || 0)
      .take(query.limit || 10)
      .getMany()

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        asset: tx.asset,
        type: tx.type,
        amount: Number.parseFloat(tx.amount),
        price: tx.price ? Number.parseFloat(tx.price) : null,
        fee: tx.fee ? Number.parseFloat(tx.fee) : null,
        status: tx.status,
        totalValue: tx.totalValue,
        createdAt: tx.createdAt,
        txHash: tx.txHash,
      })),
      total,
    }
  }

  private async updateBalance(userId: string, transaction: Transaction): Promise<void> {
    let balance = await this.balanceRepository.findOne({
      where: { userId, asset: transaction.asset },
    })

    if (!balance) {
      balance = this.balanceRepository.create({
        userId,
        asset: transaction.asset,
        available: "0",
        locked: "0",
        averageCost: "0",
      })
    }

    const currentAvailable = Number.parseFloat(balance.available)
    const currentAverageCost = Number.parseFloat(balance.averageCost)
    const transactionAmount = Number.parseFloat(transaction.amount)
    const transactionPrice = transaction.price ? Number.parseFloat(transaction.price) : 0

    switch (transaction.type) {
      case TransactionType.BUY:
      case TransactionType.DEPOSIT:
      case TransactionType.TRANSFER_IN:
        // Increase balance and update average cost
        const newTotal = currentAvailable + transactionAmount
        if (transactionPrice > 0 && transaction.type === TransactionType.BUY) {
          const totalCost = currentAvailable * currentAverageCost + transactionAmount * transactionPrice
          balance.averageCost = (totalCost / newTotal).toString()
        }
        balance.available = newTotal.toString()
        break

      case TransactionType.SELL:
      case TransactionType.WITHDRAWAL:
      case TransactionType.TRANSFER_OUT:
        // Decrease balance
        const newAvailable = Math.max(0, currentAvailable - transactionAmount)
        balance.available = newAvailable.toString()
        break
    }

    await this.balanceRepository.save(balance)
  }

  private async getCurrentPrices(assets: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {}

    // Try to get prices from cache first
    for (const asset of assets) {
      try {
        const cachedPrice = await redisClient.get(`price:${asset}`)
        if (cachedPrice) {
          prices[asset] = Number.parseFloat(cachedPrice)
        }
      } catch (error) {
        console.warn(`Failed to get cached price for ${asset}:`, error)
      }
    }

    // For missing prices, you would typically call an external price API
    // For now, we'll use mock prices
    const mockPrices: Record<string, number> = {
      XLM: 0.12,
      USDC: 1.0,
      BTC: 45000,
      ETH: 3000,
    }

    for (const asset of assets) {
      if (!prices[asset]) {
        prices[asset] = mockPrices[asset] || 0

        // Cache the price for 30 seconds
        try {
          await redisClient.setEx(`price:${asset}`, 30, prices[asset].toString())
        } catch (error) {
          console.warn(`Failed to cache price for ${asset}:`, error)
        }
      }
    }

    return prices
  }

  private async calculatePortfolioSummary(
    balances: Balance[],
    prices: Record<string, number>,
  ): Promise<PortfolioSummary> {
    const assetBalances: AssetBalance[] = []
    let totalValue = 0
    let totalCost = 0

    for (const balance of balances) {
      const currentPrice = prices[balance.asset] || 0
      const total = balance.total
      const averageCost = Number.parseFloat(balance.averageCost)
      const value = total * currentPrice
      const cost = total * averageCost
      const unrealizedPnL = value - cost
      const unrealizedPnLPercentage = cost > 0 ? (unrealizedPnL / cost) * 100 : 0

      if (total > 0) {
        assetBalances.push({
          asset: balance.asset,
          available: Number.parseFloat(balance.available),
          locked: Number.parseFloat(balance.locked),
          total,
          averageCost,
          currentPrice,
          totalValue: value,
          unrealizedPnL,
          unrealizedPnLPercentage,
        })

        totalValue += value
        totalCost += cost
      }
    }

    const totalPnL = totalValue - totalCost
    const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    const allocation = assetBalances.map((balance) => ({
      asset: balance.asset,
      value: balance.totalValue,
      percentage: totalValue > 0 ? (balance.totalValue / totalValue) * 100 : 0,
    }))

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercentage,
      balances: assetBalances,
      allocation,
    }
  }

  private async invalidatePortfolioCache(userId: string): Promise<void> {
    try {
      const pattern = `portfolio:${userId}:*`
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
    } catch (error) {
      console.warn("Failed to invalidate portfolio cache:", error)
    }
  }

  async calculateTotals(balances: AssetBalance[]): Promise<{
    totalValue: number
    totalPnL: number
    totalPnLPercentage: number
  }> {
    const totalValue = balances.reduce((sum, balance) => sum + balance.totalValue, 0)
    const totalCost = balances.reduce((sum, balance) => sum + balance.total * balance.averageCost, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
    }
  }
}
