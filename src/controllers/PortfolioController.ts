import type { Request, Response } from "express"
import type { PortfolioService } from "../services/PortfolioService"
import type { CreateTransactionDto, UpdateTransactionDto, PortfolioQueryDto } from "../dto/PortfolioDto"
import { AppError } from "../utils/AppError"
import { asyncHandler } from "../utils/asyncHandler"

export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  getDashboardPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const query: PortfolioQueryDto = {
      limit: Number.parseInt(req.query.limit as string) || 10,
      offset: Number.parseInt(req.query.offset as string) || 0,
      asset: req.query.asset as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    }

    const portfolio = await this.portfolioService.getPortfolio(userId, query)

    res.json({
      success: true,
      data: portfolio,
    })
  })

  getBalances = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const balances = await this.portfolioService.getUserBalances(userId)

    res.json({
      success: true,
      data: balances,
    })
  })

  getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const query: PortfolioQueryDto = {
      limit: Number.parseInt(req.query.limit as string) || 10,
      offset: Number.parseInt(req.query.offset as string) || 0,
      asset: req.query.asset as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    }

    const result = await this.portfolioService.getTransactionHistory(userId, query)

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: (query.offset || 0) + (query.limit || 10) < result.total,
      },
    })
  })

  createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const createTransactionDto: CreateTransactionDto = req.body
    const transaction = await this.portfolioService.createTransaction(userId, createTransactionDto)

    res.status(201).json({
      success: true,
      data: transaction,
    })
  })

  updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const transactionId = req.params.id

    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const updateTransactionDto: UpdateTransactionDto = req.body
    const transaction = await this.portfolioService.updateTransaction(transactionId, userId, updateTransactionDto)

    res.json({
      success: true,
      data: transaction,
    })
  })

  getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const transactionId = req.params.id

    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    // This would be implemented in the service
    res.json({
      success: true,
      message: "Transaction details endpoint - to be implemented",
    })
  })
}
