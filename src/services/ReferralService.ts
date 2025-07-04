import { Repository } from "typeorm";
import { BaseService } from "./BaseService";
import { ReferralCode } from "../entities/ReferralCode";
import { Referral, ReferralStatus, RewardType } from "../entities/Referral";
import { User } from "../entities/User";
import { AppDataSource } from "../config/database";
import { createReferralError } from "../middleware/errorHandler";

// Type definitions for service responses
export interface PerformanceMetrics {
  period: { start: Date; end: Date };
  groupBy: string;
  metrics: Array<{
    date: string;
    referrals: number;
    completions: number;
    conversionRate: number;
  }>;
}

export interface LeaderboardResponse {
  period: string;
  metric: string;
  leaders: Array<{
    userId: string;
    referralCount: number;
    conversionRate: number;
    user: User;
  }>;
}

export interface CohortAnalysis {
  cohortType: string;
  cohorts: Array<{
    cohortDate: string;
    totalUsers: number;
    completedReferrals: number;
    retentionRate: number;
  }>;
}

export interface CodePerformanceAnalytics {
  items: Array<{
    id: string;
    code: string;
    usageCount: number;
    completionRate: number;
    createdAt: Date;
    isActive: boolean;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface ExportData {
  data: Array<Record<string, unknown>>;
  metadata?: {
    totalRecords: number;
    exportDate: Date;
    filters: ExportFilters;
  };
}

export interface RealTimeStatistics {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsDistributed: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    referralCount: number;
    user: User;
  }>;
  realTimeMetrics: {
    activeUsers: number;
    recentSignups: number;
    pendingRewards: number;
  };
}

// Configuration constants
const REFERRER_REWARD_POINTS = parseInt(
  process.env.REFERRER_REWARD_POINTS || "100",
);
const REFERRED_REWARD_POINTS = parseInt(
  process.env.REFERRED_REWARD_POINTS || "50",
);

export class ReferralService extends BaseService<ReferralCode> {
  private referralRepo: Repository<Referral>;
  private userRepo: Repository<User>;

  constructor() {
    super(ReferralCode);
    this.referralRepo = AppDataSource.getRepository(Referral);
    this.userRepo = AppDataSource.getRepository(User);
  }

  // Generate unique referral code
  private generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate referral code for user
  async generateCode(userId: string): Promise<ReferralCode> {
    // Check if user already has an active code
    const existingCode = await this.repository.findOne({
      where: { userId, isActive: true },
    });

    if (existingCode) {
      return existingCode;
    }

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const code = this.generateReferralCode();
        const referralCode = this.repository.create({
          code,
          userId,
          isActive: true,
          usageCount: 0,
          maxUsage: 100,
          expiresAt,
        });
        return await this.repository.save(referralCode);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code === "23505"
        ) {
          // PostgreSQL unique violation
          attempts++;
          continue;
        }
        throw error;
      }
    }
    throw createReferralError.generationFailed();
  }

  // Get user's referral code
  async getUserCode(userId: string): Promise<ReferralCode | null> {
    return this.repository.findOne({
      where: { userId, isActive: true },
      relations: ["user"],
    });
  }

  // Validate and apply referral code with transaction safety
  async applyReferralCode(
    referredUserId: string,
    code: string,
  ): Promise<Referral> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the referral code within transaction
      const referralCode = await queryRunner.manager.findOne(ReferralCode, {
        where: { code, isActive: true },
        relations: ["user"],
      });

      if (!referralCode) {
        throw createReferralError.codeInvalid();
      }

      // Check if code is expired
      if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
        throw createReferralError.codeExpired();
      }

      // Check if max usage reached
      if (referralCode.usageCount >= referralCode.maxUsage) {
        throw createReferralError.usageLimit();
      }

      // Prevent self-referral
      if (referralCode.userId === referredUserId) {
        throw createReferralError.selfReferral();
      }

      // Check if user already used a referral code
      const existingReferral = await queryRunner.manager.findOne(Referral, {
        where: { referredUserId },
      });

      if (existingReferral) {
        throw createReferralError.alreadyUsed();
      }

      // Check if referral code was created recently (business rule validation)
      const codeAge = new Date().getTime() - referralCode.createdAt.getTime();
      if (codeAge < 60000) {
        // 1 minute
        throw createReferralError.codeTooNew();
      }

      // Create referral record
      const referral = queryRunner.manager.create(Referral, {
        referrerId: referralCode.userId,
        referredUserId,
        referralCodeUsed: code,
        status: ReferralStatus.PENDING,
        rewardEarnedReferrer: {
          type: RewardType.POINTS,
          value: REFERRER_REWARD_POINTS,
          description: "Referral bonus for bringing a new user",
        },
        rewardEarnedReferred: {
          type: RewardType.POINTS,
          value: REFERRED_REWARD_POINTS,
          description: "Welcome bonus for joining through referral",
        },
      });

      const savedReferral = await queryRunner.manager.save(referral);

      // Update referral code usage count atomically within transaction
      await queryRunner.manager
        .createQueryBuilder()
        .update(ReferralCode)
        .set({ usageCount: () => "usageCount + 1" })
        .where("id = :id", { id: referralCode.id })
        .execute();

      await queryRunner.commitTransaction();
      return savedReferral;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Complete referral (when referred user meets criteria)
  async completeReferral(
    referralId: string,
    completionTrigger: string = "profile_completed",
  ): Promise<Referral> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const referral = await queryRunner.manager.findOne(Referral, {
        where: { id: referralId },
        relations: ["referrer", "referredUser"],
      });

      if (!referral) {
        throw createReferralError.notFound();
      }

      if (referral.status !== ReferralStatus.PENDING) {
        throw createReferralError.notPending();
      }

      // Update referral status
      referral.status = ReferralStatus.COMPLETED;
      referral.completedAt = new Date();
      referral.metadata = {
        ...referral.metadata,
        completionTrigger,
        referrerPoints: referral.rewardEarnedReferrer?.value || 0,
        referredPoints: referral.rewardEarnedReferred?.value || 0,
      };

      const completedReferral = await queryRunner.manager.save(referral);
      await queryRunner.commitTransaction();
      return completedReferral;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Get user's referral status and rewards
  async getUserReferralStatus(userId: string): Promise<{
    referralCode: ReferralCode | null;
    referralsMade: Referral[];
    referralReceived: Referral | null;
    totalRewardsEarned: number;
  }> {
    const referralCode = await this.getUserCode(userId);

    const referralsMade = await this.referralRepo.find({
      where: { referrerId: userId },
      relations: ["referredUser"],
      order: { createdAt: "DESC" },
    });

    const referralReceived = await this.referralRepo.findOne({
      where: { referredUserId: userId },
      relations: ["referrer"],
    });

    const totalRewardsEarned = referralsMade
      .filter((r) => r.status === ReferralStatus.COMPLETED)
      .reduce((sum, r) => sum + (r.rewardEarnedReferrer?.value || 0), 0);

    return {
      referralCode,
      referralsMade,
      referralReceived,
      totalRewardsEarned,
    };
  }

  // Admin: Get all referrals with pagination
  async getAllReferrals(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Referral[];
    total: number;
  }> {
    const [items, total] = await this.referralRepo.findAndCount({
      relations: ["referrer", "referredUser"],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return { items, total };
  }

  // Admin: Manually complete referral
  async adminCompleteReferral(
    referralId: string,
    adminNotes?: string,
  ): Promise<Referral> {
    const referral = await this.completeReferral(referralId, "admin_override");

    if (adminNotes) {
      referral.metadata = {
        ...referral.metadata,
        notes: adminNotes,
      };
      await this.referralRepo.save(referral);
    }

    return referral;
  }

  // Admin: Deactivate referral code
  async deactivateReferralCode(codeId: string): Promise<ReferralCode> {
    const code = await this.findOne(codeId);
    if (!code) {
      throw createReferralError.codeNotFound();
    }

    code.isActive = false;
    return this.repository.save(code);
  }

  // Get referral statistics with enhanced analytics
  async getReferralStatistics(): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewardsDistributed: number;
    conversionRate: number;
    topReferrers: Array<{
      userId: string;
      referralCount: number;
      user: User;
    }>;
  }> {
    const totalReferrals = await this.referralRepo.count();
    const completedReferrals = await this.referralRepo.count({
      where: { status: ReferralStatus.COMPLETED },
    });
    const pendingReferrals = await this.referralRepo.count({
      where: { status: ReferralStatus.PENDING },
    });

    const completedReferralsList = await this.referralRepo.find({
      where: { status: ReferralStatus.COMPLETED },
    });

    const totalRewardsDistributed = completedReferralsList.reduce(
      (sum, r) =>
        sum +
        (r.rewardEarnedReferrer?.value || 0) +
        (r.rewardEarnedReferred?.value || 0),
      0,
    );

    // Calculate conversion rate
    const conversionRate =
      totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    // Get top referrers
    const topReferrersQuery = await this.referralRepo
      .createQueryBuilder("referral")
      .select("referral.referrerId", "userId")
      .addSelect("COUNT(*)", "referralCount")
      .where("referral.status = :status", { status: ReferralStatus.COMPLETED })
      .groupBy("referral.referrerId")
      .orderBy("referralCount", "DESC")
      .limit(10)
      .getRawMany();

    const topReferrers = (
      await Promise.all(
        topReferrersQuery.map(async (item) => {
          const user = await this.userRepo.findOne({
            where: { id: item.userId },
          });
          if (!user) {
            return null;
          }
          return {
            userId: item.userId,
            referralCount: parseInt(item.referralCount),
            user: user,
          };
        }),
      )
    ).filter(
      (
        result,
      ): result is { userId: string; referralCount: number; user: User } =>
        result !== null,
    );

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewardsDistributed,
      conversionRate,
      topReferrers,
    };
  }

  // New method: Get referral analytics with time-based data
  async getReferralAnalytics(period: string = "30d"): Promise<{
    dailyReferrals: Array<{ date: string; count: number; completed: number }>;
    conversionRate: number;
    topPerformingCodes: Array<{
      code: string;
      usageCount: number;
      completionRate: number;
    }>;
  }> {
    // Parse period (30d, 7d, 1y)
    const days = period.endsWith("d")
      ? parseInt(period)
      : period.endsWith("y")
        ? parseInt(period) * 365
        : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily referral data
    const dailyData = await this.referralRepo
      .createQueryBuilder("referral")
      .select("DATE(referral.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .addSelect(
        "SUM(CASE WHEN referral.status = 'COMPLETED' THEN 1 ELSE 0 END)",
        "completed",
      )
      .where("referral.createdAt >= :startDate", { startDate })
      .groupBy("DATE(referral.createdAt)")
      .orderBy("date", "ASC")
      .getRawMany();

    const dailyReferrals = dailyData.map((row) => ({
      date: row.date,
      count: parseInt(row.count),
      completed: parseInt(row.completed),
    }));

    // Calculate overall conversion rate for the period
    const totalCount = dailyReferrals.reduce((sum, day) => sum + day.count, 0);
    const totalCompleted = dailyReferrals.reduce(
      (sum, day) => sum + day.completed,
      0,
    );
    const conversionRate =
      totalCount > 0 ? (totalCompleted / totalCount) * 100 : 0;

    // Get top performing codes
    const topCodes = await this.repository
      .createQueryBuilder("code")
      .leftJoin("referrals", "r", "r.referralCodeUsed = code.code")
      .select("code.code", "code")
      .addSelect("code.usageCount", "usageCount")
      .addSelect(
        "COUNT(CASE WHEN r.status = 'COMPLETED' THEN 1 END)",
        "completedCount",
      )
      .where("code.usageCount > 0")
      .groupBy("code.code, code.usageCount")
      .orderBy("code.usageCount", "DESC")
      .limit(10)
      .getRawMany();

    const topPerformingCodes = topCodes.map((row) => ({
      code: row.code,
      usageCount: parseInt(row.usageCount),
      completionRate:
        row.usageCount > 0
          ? (parseInt(row.completedCount) / parseInt(row.usageCount)) * 100
          : 0,
    }));

    return {
      dailyReferrals,
      conversionRate,
      topPerformingCodes,
    };
  }

  // New methods for enhanced admin analytics
  async getPerformanceMetrics(
    startDate: Date,
    groupBy: string = "day",
    includeInactive: boolean = false,
  ): Promise<PerformanceMetrics> {
    // Implementation placeholder - would include detailed performance metrics
    return {
      period: { start: startDate, end: new Date() },
      groupBy,
      metrics: [],
    };
  }

  async getLeaderboard(
    period: string = "30d",
    limit: number = 10,
    metric: string = "referrals",
  ): Promise<LeaderboardResponse> {
    // Implementation placeholder - would include leaderboard data
    return {
      period,
      metric,
      leaders: [],
    };
  }

  async getCohortAnalysis(
    startDate?: Date,
    endDate?: Date,
    cohortType: string = "monthly",
  ): Promise<CohortAnalysis> {
    // Implementation placeholder - would include cohort analysis
    return {
      cohortType,
      cohorts: [],
    };
  }

  async getCodePerformanceAnalytics(
    page: number = 1,
    limit: number = 20,
    sortBy: string = "usageCount",
    sortOrder: string = "DESC",
    includeInactive: boolean = false,
  ): Promise<CodePerformanceAnalytics> {
    // Implementation placeholder - would include code performance data
    return {
      items: [],
      total: 0,
      page,
      limit,
    };
  }

  async bulkUpdateReferrals(
    referralIds: string[],
    action: string,
    adminId: string,
    reason?: string,
    notifyUsers: boolean = false,
  ): Promise<Array<{ id: string; success: boolean; error?: string }>> {
    // Implementation placeholder - would handle bulk operations
    return referralIds.map((id) => ({ id, success: true }));
  }

  async exportData(
    type: string,
    format: string,
    filters: ExportFilters,
  ): Promise<string | ExportData> {
    // Implementation placeholder - would handle data export
    return format === "csv" ? "CSV data" : { data: [] };
  }

  async getRealTimeStatistics(): Promise<RealTimeStatistics> {
    // Implementation placeholder - would include real-time stats
    const basic = await this.getReferralStatistics();
    return {
      ...basic,
      realTimeMetrics: {
        activeUsers: 0,
        recentSignups: 0,
        pendingRewards: 0,
      },
    };
  }
}
