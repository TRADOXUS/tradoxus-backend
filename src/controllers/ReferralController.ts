import { Request, Response } from "express";
import { ReferralService } from "../services/ReferralService";
import { AppError } from "../middleware/errorHandler";

export class ReferralController {
  private referralService: ReferralService;

  constructor(service?: ReferralService) {
    this.referralService = service || new ReferralService();
  }

  // POST /api/referral/generate-code
  async generateCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "User not authenticated");
      }

      const referralCode = await this.referralService.generateCode(userId);
      res.json({
        status: "success",
        data: {
          code: referralCode.code,
          expiresAt: referralCode.expiresAt,
          usageCount: referralCode.usageCount,
          maxUsage: referralCode.maxUsage,
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        500,
        `Failed to generate referral code: ${err.message}`,
      );
    }
  }

  // GET /api/referral/my-code
  async getMyCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "User not authenticated");
      }

      const referralCode = await this.referralService.getUserCode(userId);
      if (!referralCode) {
        res.json({
          status: "success",
          data: null,
          message: "No active referral code found. Generate one first.",
        });
        return;
      }

      res.json({
        status: "success",
        data: {
          code: referralCode.code,
          expiresAt: referralCode.expiresAt,
          usageCount: referralCode.usageCount,
          maxUsage: referralCode.maxUsage,
          shareUrl: process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/signup?ref=${referralCode.code}`
            : `/signup?ref=${referralCode.code}`,
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, `Failed to fetch referral code: ${err.message}`);
    }
  }

  // POST /api/referral/apply-code
  async applyCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, "User not authenticated");
      }

      if (!code) {
        throw new AppError(400, "Referral code is required");
      }

      const referral = await this.referralService.applyReferralCode(
        userId,
        code,
      );
      res.json({
        status: "success",
        data: {
          referralId: referral.id,
          reward: referral.rewardEarnedReferred,
          message:
            "Referral code applied successfully! Your reward will be credited once you complete your profile.",
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to apply referral code");
    }
  }

  // GET /api/referral/status
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "User not authenticated");
      }

      const status = await this.referralService.getUserReferralStatus(userId);
      res.json({
        status: "success",
        data: status,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch referral status");
    }
  }

  // POST /api/referral/complete/:referralId (Internal use)
  async completeReferral(req: Request, res: Response): Promise<void> {
    try {
      const { referralId } = req.params;
      const { trigger } = req.body;

      const referral = await this.referralService.completeReferral(
        referralId,
        trigger,
      );
      res.json({
        status: "success",
        data: referral,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to complete referral");
    }
  }

  // Admin endpoints
  // GET /api/referral/admin/all
  async getAllReferrals(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10),
      );

      if (isNaN(page) || isNaN(limit)) {
        throw new AppError(400, "Invalid pagination parameters");
      }

      const referrals = await this.referralService.getAllReferrals(page, limit);
      res.json({
        status: "success",
        data: referrals,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, `Failed to fetch referrals: ${err.message}`);
    }
  }

  // POST /api/referral/admin/complete/:referralId
  async adminCompleteReferral(req: Request, res: Response): Promise<void> {
    try {
      const { referralId } = req.params;
      const { notes } = req.body;

      const referral = await this.referralService.adminCompleteReferral(
        referralId,
        notes,
      );
      res.json({
        status: "success",
        data: referral,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to complete referral");
    }
  }

  // POST /api/referral/admin/deactivate-code/:codeId
  async deactivateCode(req: Request, res: Response): Promise<void> {
    try {
      const { codeId } = req.params;

      const code = await this.referralService.deactivateReferralCode(codeId);
      res.json({
        status: "success",
        data: code,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to deactivate referral code");
    }
  }

  // GET /api/referral/admin/statistics
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.referralService.getReferralStatistics();
      res.json({
        status: "success",
        data: stats,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch referral statistics");
    }
  }
}
