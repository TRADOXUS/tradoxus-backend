import { Router } from "express";
import { ReferralController } from "../controllers/ReferralController";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/adminAuthMiddleware";

const router = Router();
const referralController = new ReferralController();

// User referral endpoints (require authentication)
router.post(
  "/generate-code",
  authenticate,
  asyncHandler((req, res) => referralController.generateCode(req, res))
);

router.get(
  "/my-code",
  authenticate,
  asyncHandler((req, res) => referralController.getMyCode(req, res))
);

router.post(
  "/apply-code",
  authenticate,
  asyncHandler((req, res) => referralController.applyCode(req, res))
);

router.get(
  "/status",
  authenticate,
  asyncHandler((req, res) => referralController.getStatus(req, res))
);

// Internal endpoint for completing referrals
router.post(
  "/complete/:referralId",
  authenticate,
  asyncHandler((req, res) => referralController.completeReferral(req, res))
);

// Admin endpoints (require admin authentication)
router.get(
  "/admin/all",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getAllReferrals(req, res))
);

router.post(
  "/admin/complete/:referralId",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.adminCompleteReferral(req, res))
);

router.post(
  "/admin/deactivate-code/:codeId",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.deactivateCode(req, res))
);

router.get(
  "/admin/statistics",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getStatistics(req, res))
);

export default router;
