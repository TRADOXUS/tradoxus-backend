import { ReferralCode } from "../entities/ReferralCode";
import { Referral, ReferralStatus, RewardType } from "../entities/Referral";

export class ReferralCodeGenerator {
  private static readonly CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  private static readonly CODE_LENGTH = 8;

  static generate(): string {
    let result = "";
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      result += this.CHARS.charAt(
        Math.floor(Math.random() * this.CHARS.length),
      );
    }
    return result;
  }

  static isValid(code: string): boolean {
    return (
      typeof code === "string" &&
      code.length === this.CODE_LENGTH &&
      /^[A-Z0-9]+$/.test(code)
    );
  }
}

export class ReferralValidator {
  static validateCodeUsage(referralCode: ReferralCode): {
    isValid: boolean;
    reason?: string;
  } {
    if (!referralCode.isActive) {
      return { isValid: false, reason: "Code is inactive" };
    }

    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
      return { isValid: false, reason: "Code has expired" };
    }

    if (referralCode.usageCount >= referralCode.maxUsage) {
      return { isValid: false, reason: "Usage limit reached" };
    }

    // Check if code is too new (1 minute minimum age)
    const codeAge = new Date().getTime() - referralCode.createdAt.getTime();
    if (codeAge < 60000) {
      return { isValid: false, reason: "Code is too new" };
    }

    return { isValid: true };
  }

  static canUserApplyCode(
    referralCode: ReferralCode,
    userId: string,
    existingReferral?: Referral,
  ): { canApply: boolean; reason?: string } {
    // Check if user is trying to self-refer
    if (referralCode.userId === userId) {
      return { canApply: false, reason: "Self-referral not allowed" };
    }

    // Check if user already used a referral code
    if (existingReferral) {
      return { canApply: false, reason: "User already used a referral code" };
    }

    return { canApply: true };
  }
}

export class ReferralRewardCalculator {
  static createReferrerReward(points: number): {
    type: RewardType;
    value: number;
    description: string;
  } {
    return {
      type: RewardType.POINTS,
      value: points,
      description: "Referral bonus for bringing a new user",
    };
  }

  static createReferredReward(points: number): {
    type: RewardType;
    value: number;
    description: string;
  } {
    return {
      type: RewardType.POINTS,
      value: points,
      description: "Welcome bonus for joining through referral",
    };
  }

  static calculateTotalRewards(referrals: Referral[]): {
    totalEarned: number;
    totalClaimed: number;
    pendingRewards: number;
  } {
    const completedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED,
    );

    const totalEarned = completedReferrals.reduce(
      (sum, r) => sum + (r.rewardEarnedReferrer?.value || 0),
      0,
    );

    const totalClaimed = completedReferrals
      .filter((r) => r.referrerRewardClaimed)
      .reduce((sum, r) => sum + (r.rewardEarnedReferrer?.value || 0), 0);

    const pendingRewards = totalEarned - totalClaimed;

    return { totalEarned, totalClaimed, pendingRewards };
  }
}

export class ReferralAnalytics {
  static calculateConversionRate(
    totalReferrals: number,
    completedReferrals: number,
  ): number {
    return totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;
  }

  static categorizeByPeriod(
    referrals: Referral[],
    periodDays: number = 30,
  ): {
    recent: Referral[];
    older: Referral[];
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const recent = referrals.filter((r) => r.createdAt >= cutoffDate);
    const older = referrals.filter((r) => r.createdAt < cutoffDate);

    return { recent, older };
  }

  static calculateCodePerformance(
    code: ReferralCode,
    associatedReferrals: Referral[],
  ): {
    usageCount: number;
    completionRate: number;
    averageTimeToComplete: number; // in hours
  } {
    const completedReferrals = associatedReferrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED && r.completedAt,
    );

    const completionRate =
      associatedReferrals.length > 0
        ? (completedReferrals.length / associatedReferrals.length) * 100
        : 0;

    const averageTimeToComplete =
      completedReferrals.length > 0
        ? completedReferrals.reduce((sum, r) => {
            const timeToComplete =
              (r.completedAt!.getTime() - r.createdAt.getTime()) /
              (1000 * 60 * 60); // Convert to hours
            return sum + timeToComplete;
          }, 0) / completedReferrals.length
        : 0;

    return {
      usageCount: code.usageCount,
      completionRate,
      averageTimeToComplete,
    };
  }

  static groupByTimeFrame(
    referrals: Referral[],
    timeFrame: "day" | "week" | "month" = "day",
  ): Array<{ period: string; total: number; completed: number }> {
    const groups = new Map<string, { total: number; completed: number }>();

    referrals.forEach((referral) => {
      let key: string;
      const date = new Date(referral.createdAt);

      switch (timeFrame) {
        case "day":
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week":
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split("T")[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          key = date.toISOString().split("T")[0];
      }

      if (!groups.has(key)) {
        groups.set(key, { total: 0, completed: 0 });
      }

      const group = groups.get(key)!;
      group.total++;
      if (referral.status === ReferralStatus.COMPLETED) {
        group.completed++;
      }
    });

    return Array.from(groups.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}

export class ReferralFormatter {
  static formatShareUrl(code: string, baseUrl?: string): string {
    const frontendUrl = baseUrl || process.env.FRONTEND_URL;
    return frontendUrl
      ? `${frontendUrl}/signup?ref=${code}`
      : `/signup?ref=${code}`;
  }

  static formatReferralSummary(referral: Referral): {
    id: string;
    referrerName: string;
    referredName: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    rewards: {
      referrer: number;
      referred: number;
    };
  } {
    return {
      id: referral.id,
      referrerName: referral.referrer?.nickname || "Unknown",
      referredName: referral.referredUser?.nickname || "Unknown",
      status: referral.status,
      createdAt: referral.createdAt.toISOString(),
      completedAt: referral.completedAt?.toISOString() || null,
      rewards: {
        referrer: referral.rewardEarnedReferrer?.value || 0,
        referred: referral.rewardEarnedReferred?.value || 0,
      },
    };
  }

  static formatCodeSummary(code: ReferralCode): {
    id: string;
    code: string;
    ownerName: string;
    usageCount: number;
    maxUsage: number;
    utilizationRate: number;
    isActive: boolean;
    expiresAt: string | null;
    shareUrl: string;
  } {
    const utilizationRate = (code.usageCount / code.maxUsage) * 100;

    return {
      id: code.id,
      code: code.code,
      ownerName: code.user?.nickname || "Unknown",
      usageCount: code.usageCount,
      maxUsage: code.maxUsage,
      utilizationRate: Math.round(utilizationRate),
      isActive: code.isActive,
      expiresAt: code.expiresAt?.toISOString() || null,
      shareUrl: this.formatShareUrl(code.code),
    };
  }
}

// Configuration helper
export class ReferralConfig {
  static readonly DEFAULT_REFERRER_POINTS = 100;
  static readonly DEFAULT_REFERRED_POINTS = 50;
  static readonly DEFAULT_MAX_USAGE = 100;
  static readonly DEFAULT_EXPIRY_DAYS = 365;
  static readonly CODE_MIN_AGE_MS = 60000; // 1 minute

  static getReferrerRewardPoints(): number {
    return parseInt(
      process.env.REFERRER_REWARD_POINTS ||
        String(this.DEFAULT_REFERRER_POINTS),
    );
  }

  static getReferredRewardPoints(): number {
    return parseInt(
      process.env.REFERRED_REWARD_POINTS ||
        String(this.DEFAULT_REFERRED_POINTS),
    );
  }

  static getMaxUsagePerCode(): number {
    return parseInt(
      process.env.REFERRAL_MAX_USAGE || String(this.DEFAULT_MAX_USAGE),
    );
  }

  static getExpiryDate(): Date {
    const date = new Date();
    const expiryDays = parseInt(
      process.env.REFERRAL_EXPIRY_DAYS || String(this.DEFAULT_EXPIRY_DAYS),
    );
    date.setDate(date.getDate() + expiryDays);
    return date;
  }

  static getCodeMinAge(): number {
    return parseInt(
      process.env.REFERRAL_CODE_MIN_AGE_MS || String(this.CODE_MIN_AGE_MS),
    );
  }
}
