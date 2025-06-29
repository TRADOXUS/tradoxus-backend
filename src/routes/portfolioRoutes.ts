import { Router } from "express"
import { PortfolioController } from "../controllers/PortfolioController"
import { rateLimiter } from "../middleware/rateLimiter"
import { authenticate } from "src/middleware/authMiddleware"

const router = Router()
const portfolioController = new PortfolioController()

// Apply authentication to all portfolio routes
router.use(authenticate)

// Apply rate limiting
router.use(rateLimiter)

// Portfolio summary
router.get("/summary", portfolioController.getPortfolioSummary)

// Asset balances
router.get("/balances", portfolioController.getAssetBalances)

// Transaction history
router.get("/transactions", PortfolioController.validateTransactionHistory, portfolioController.getTransactionHistory)

// Portfolio performance
router.get("/performance/:period", PortfolioController.validatePeriodParam, portfolioController.getPortfolioPerformance)

// Portfolio history
router.get("/history/:period", PortfolioController.validateHistoryQuery, portfolioController.getPortfolioHistory)

export { router as portfolioRoutes }
