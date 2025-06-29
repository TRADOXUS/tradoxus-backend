import { Request, Response } from "express"
import { PortfolioService } from "../services/PortfolioService"
import { asyncHandler } from "../utils/asyncHandler"
import { AppError } from "../utils/AppError"
import { validateRequestEx } from "../middleware/validateRequestEx"

import { query, param } from "express-validator"
import { RequestHandler } from "express"

export class PortfolioController {
  private portfolioService: PortfolioService

  constructor() {
    this.portfolioService = new PortfolioService()
  }

  getPortfolioSummary: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const summary = await this.portfolioService.getPortfolioSummary(userId)

    res.status(200).json({
      success: true,
      data: summary,
      message: "Portfolio summary retrieved successfully",
    })
  })

  getAssetBalances: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const balances = await this.portfolioService.getAssetBalances(userId)

    res.status(200).json({
      success: true,
      data: balances,
      message: "Asset balances retrieved successfully",
    })
  })

  getTransactionHistory: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const limit = Number.parseInt(req.query.limit as string) || 50
    const offset = Number.parseInt(req.query.offset as string) || 0
    const asset = req.query.asset as string

    const result = await this.portfolioService.getTransactionHistory(userId, limit, offset, asset)

    res.status(200).json({
      success: true,
      data: result,
      message: "Transaction history retrieved successfully",
    })
  })

  getPortfolioPerformance: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const period = req.params.period as "day" | "week" | "month" | "year"

    if (!["day", "week", "month", "year"].includes(period)) {
      throw new AppError("Invalid period. Must be one of: day, week, month, year", 400)
    }

    const performance = await this.portfolioService.getPortfolioPerformance(userId, period)

    res.status(200).json({
      success: true,
      data: performance,
      message: "Portfolio performance retrieved successfully",
    })
  })

  getPortfolioHistory: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError("User not authenticated", 401)
    }

    const period = req.params.period as "day" | "week" | "month" | "year"
    const points = Number.parseInt(req.query.points as string) || 30

    if (!["day", "week", "month", "year"].includes(period)) {
      throw new AppError("Invalid period. Must be one of: day, week, month, year", 400)
    }

    if (points < 1 || points > 365) {
      throw new AppError("Points must be between 1 and 365", 400)
    }

    const history = await this.portfolioService.getPortfolioHistory(userId, period, points)

    res.status(200).json({
      success: true,
      data: history,
      message: "Portfolio history retrieved successfully",
    })
  })

  // ✅ Express-validator middleware chains
  static validateTransactionHistory: RequestHandler[] = [
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be non-negative"),
    query("asset").optional().isString().isLength({ min: 1, max: 20 }).withMessage("Asset must be 1–20 characters"),
    validateRequestEx,
  ]

  static validatePeriodParam: RequestHandler[] = [
    param("period").isIn(["day", "week", "month", "year"]).withMessage("Period must be one of: day, week, month, year"),
    validateRequestEx,
  ]

  static validateHistoryQuery: RequestHandler[] = [
    param("period").isIn(["day", "week", "month", "year"]).withMessage("Period must be one of: day, week, month, year"),
    query("points").optional().isInt({ min: 1, max: 365 }).withMessage("Points must be between 1 and 365"),
    validateRequestEx,
  ]
}
