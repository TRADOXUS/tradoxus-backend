import { Router } from "express";
import { ReferralController } from "../controllers/ReferralController";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/adminAuthMiddleware";
import { validateDto } from "../middleware/validation";
import {
  ApplyReferralCodeDto,
  CompleteReferralDto,
  AdminCompleteReferralDto,
} from "../dto/ReferralDto";

const router = Router();
const referralController = new ReferralController();

// User referral endpoints (require authentication)
router.post(
  "/generate-code",
  authenticate,
  asyncHandler((req, res) => referralController.generateCode(req, res)),
);

router.get(
  "/my-code",
  authenticate,
  asyncHandler((req, res) => referralController.getMyCode(req, res)),
);

router.post(
  "/apply-code",
  authenticate,
  validateDto(ApplyReferralCodeDto),
  asyncHandler((req, res) => referralController.applyCode(req, res)),
);

router.get(
  "/status",
  authenticate,
  asyncHandler((req, res) => referralController.getStatus(req, res)),
);

// Internal endpoint for completing referrals
router.post(
  "/complete/:referralId",
  authenticate,
  validateDto(CompleteReferralDto),
  asyncHandler((req, res) => referralController.completeReferral(req, res)),
);

// Admin endpoints (require admin authentication)
router.get(
  "/admin/all",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getAllReferrals(req, res)),
);

router.post(
  "/admin/complete/:referralId",
  authenticate,
  requireAdmin,
  validateDto(AdminCompleteReferralDto),
  asyncHandler((req, res) =>
    referralController.adminCompleteReferral(req, res),
  ),
);

router.post(
  "/admin/deactivate-code/:codeId",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.deactivateCode(req, res)),
);

router.get(
  "/admin/statistics",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getStatistics(req, res)),
);

// Enhanced admin analytics endpoints
router.get(
  "/admin/analytics",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getAnalytics(req, res)),
);

router.get(
  "/admin/performance",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) =>
    referralController.getPerformanceMetrics(req, res),
  ),
);

router.get(
  "/admin/leaderboard",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getLeaderboard(req, res)),
);

router.get(
  "/admin/cohort-analysis",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getCohortAnalysis(req, res)),
);

router.get(
  "/admin/code-performance",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getCodePerformance(req, res)),
);

router.post(
  "/admin/bulk-action",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.bulkAction(req, res)),
);

router.get(
  "/admin/export",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.exportData(req, res)),
);

router.get(
  "/admin/real-time-stats",
  authenticate,
  requireAdmin,
  asyncHandler((req, res) => referralController.getRealTimeStats(req, res)),
);

export default router;
