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

  // GET /api/referral/admin/analytics
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = "30d", timeFrame = "day", userId } = req.query;
      
      const analytics = await this.referralService.getReferralAnalytics(
        period as string
      );
      
      res.json({
        status: "success",
        data: analytics,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch referral analytics");
    }
  }

  // GET /api/referral/admin/performance
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { 
        period = "30d", 
        groupBy = "day",
        includeInactive = false 
      } = req.query;

      // Parse period to days
      const days = period === "7d" ? 7 : 
                   period === "90d" ? 90 : 
                   period === "1y" ? 365 : 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get performance metrics
      const metrics = await this.referralService.getPerformanceMetrics(
        startDate,
        groupBy as string,
        includeInactive === "true"
      );

      res.json({
        status: "success",
        data: metrics,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch performance metrics");
    }
  }

  // GET /api/referral/admin/leaderboard
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { 
        period = "30d", 
        limit = "10",
        metric = "referrals" 
      } = req.query;

      const leaderboard = await this.referralService.getLeaderboard(
        period as string,
        parseInt(limit as string),
        metric as string
      );

      res.json({
        status: "success",
        data: leaderboard,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch leaderboard");
    }
  }

  // GET /api/referral/admin/cohort-analysis
  async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate,
        endDate,
        cohortType = "monthly" 
      } = req.query;

      const analysis = await this.referralService.getCohortAnalysis(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        cohortType as string
      );

      res.json({
        status: "success",
        data: analysis,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch cohort analysis");
    }
  }

  // GET /api/referral/admin/code-performance
  async getCodePerformance(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = "1", 
        limit = "20",
        sortBy = "usageCount",
        sortOrder = "DESC",
        includeInactive = "false"
      } = req.query;

      const performance = await this.referralService.getCodePerformanceAnalytics(
        parseInt(page as string),
        parseInt(limit as string),
        sortBy as string,
        sortOrder as string,
        includeInactive === "true"
      );

      res.json({
        status: "success",
        data: performance,
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch code performance data");
    }
  }

  // POST /api/referral/admin/bulk-action
  async bulkAction(req: Request, res: Response): Promise<void> {
    try {
      const { referralIds, action, reason, notifyUsers = false } = req.body;
      
      if (!referralIds || !Array.isArray(referralIds) || referralIds.length === 0) {
        throw new AppError(400, "Referral IDs are required");
      }

      if (!["complete", "cancel", "reactivate"].includes(action)) {
        throw new AppError(400, "Invalid action type");
      }

      const results = await this.referralService.bulkUpdateReferrals(
        referralIds,
        action,
        req.user?.id || "system",
        reason,
        notifyUsers
      );

      res.json({
        status: "success",
        data: {
          processed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to process bulk action");
    }
  }

  // GET /api/referral/admin/export
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const { 
        format = "csv",
        type = "referrals",
        startDate,
        endDate,
        status 
      } = req.query;

      if (!["csv", "json"].includes(format as string)) {
        throw new AppError(400, "Invalid export format");
      }

      if (!["referrals", "codes", "analytics"].includes(type as string)) {
        throw new AppError(400, "Invalid export type");
      }

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
      };

      const exportData = await this.referralService.exportData(
        type as string,
        format as string,
        filters
      );

      // Set appropriate headers for file download
      const filename = `referral-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === "csv") {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(exportData);
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, "Failed to export data");
    }
  }

  // GET /api/referral/admin/real-time-stats
  async getRealTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.referralService.getRealTimeStatistics();
      
      res.json({
        status: "success",
        data: {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      throw new AppError(500, "Failed to fetch real-time statistics");
    }
  }
}
