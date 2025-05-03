import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import rateLimit from "express-rate-limit";

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Rate limiting for registration and login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for nonce generation
const nonceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message: "Too many nonce requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Register a new user with wallet
router.post("/register", authLimiter, authController.register);

// Generate nonce for wallet verification
router.get("/nonce/:walletAddress", nonceLimiter, authController.generateNonce);

// Verify wallet signature
router.post("/verify-wallet", authLimiter, authController.verifyWallet);

// Login with wallet
router.post("/login", authLimiter, authController.login);

export default router;
