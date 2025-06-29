import { Router } from "express"
import { PortfolioController } from "../controllers/PortfolioController"
import { PortfolioService } from "../services/PortfolioService"
import { AppDataSource } from "../config/database"
import { Transaction } from "../entities/Transaction"
import { Balance } from "../entities/Balance"
import { User } from "../entities/User"
import { validateRequest } from "../middleware/validateRequest"
import { CreateTransactionDto, UpdateTransactionDto } from "../dto/PortfolioDto"
import { rateLimiter } from "../middleware/rateLimiter"
import { authenticate } from "src/middleware/authMiddleware"

export function createPortfolioRoutes(): Router {
  const router = Router()

  // Initialize service and controller
  const portfolioService = new PortfolioService(
    AppDataSource.getRepository(Transaction),
    AppDataSource.getRepository(Balance),
    AppDataSource.getRepository(User),
  )
  const portfolioController = new PortfolioController(portfolioService)

  // Apply authentication middleware to all routes
  router.use(authenticate)

  // Apply rate limiting
  router.use(rateLimiter)

  // Dashboard portfolio endpoint - main endpoint for the dashboard
  router.get("/dashboard", portfolioController.getDashboardPortfolio)

  // Get user balances
  router.get("/balances", portfolioController.getBalances)

  // Get transaction history with pagination and filtering
  router.get("/transactions", portfolioController.getTransactionHistory)

  // Create new transaction
  router.post("/transactions", validateRequest(CreateTransactionDto), portfolioController.createTransaction)

  // Update transaction
  router.patch("/transactions/:id", validateRequest(UpdateTransactionDto), portfolioController.updateTransaction)

  // Get specific transaction
  router.get("/transactions/:id", portfolioController.getTransaction)

  return router
}

export default createPortfolioRoutes()
