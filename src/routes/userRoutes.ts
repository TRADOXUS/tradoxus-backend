import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticate } from "../middleware/authMiddleware";
import { User } from "../entities/User";

const router = Router();
const userController = new UserController(User);

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get("/me", userController.getCurrentUser);

// Update user profile
router.patch("/me", userController.updateProfile);

// Deactivate user account
router.post("/me/deactivate", userController.deactivateAccount);

export default router;
