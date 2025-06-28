import { Repository } from "typeorm";
import { BaseService } from "./BaseService";
import { ReferralCode } from "../entities/ReferralCode";
import { Referral, ReferralStatus, RewardType } from "../entities/Referral";
import { User } from "../entities/User";
import { AppDataSource } from "../config/database";
import { AppError } from "../middleware/errorHandler";

// Remove the unused ReferralReward import since it's defined in the entity file

export class ReferralService extends BaseService<ReferralCode> {
  private referralRepo: Repository<Referral>;
  private userRepo: Repository<User>;

  constructor() {
    super(ReferralCode);
    this.referralRepo = AppDataSource.getRepository(Referral);
    this.userRepo = AppDataSource.getRepository(User);
  }

  // Make referralRepo public for external access if needed
  public getReferralRepository(): Repository<Referral> {
    return this.referralRepo;
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

    // Generate unique code
    let code: string;
    let isUnique = false;

    do {
      code = this.generateReferralCode();
      const existing = await this.repository.findOne({ where: { code } });
      isUnique = !existing;
    } while (!isUnique);

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const referralCode = this.repository.create({
      code,
      userId,
      isActive: true,
      usageCount: 0,
      maxUsage: 100,
      expiresAt,
    });

    return this.repository.save(referralCode);
  }

  // Get user's referral code
  async getUserCode(userId: string): Promise<ReferralCode | null> {
    return this.repository.findOne({
      where: { userId, isActive: true },
      relations: ["user"],
    });
  }

  // Validate and apply referral code
  async applyReferralCode(
    referredUserId: string,
    code: string
  ): Promise<Referral> {
    // Find the referral code
    const referralCode = await this.repository.findOne({
      where: { code, isActive: true },
      relations: ["user"],
    });

    if (!referralCode) {
      throw new AppError(400, "Invalid or expired referral code");
    }

    // Check if code is expired
    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
      throw new AppError(400, "Referral code has expired");
    }

    // Check if max usage reached
    if (referralCode.usageCount >= referralCode.maxUsage) {
      throw new AppError(400, "Referral code usage limit reached");
    }

    // Prevent self-referral
    if (referralCode.userId === referredUserId) {
      throw new AppError(400, "Cannot use your own referral code");
    }

    // Check if user already used a referral code
    const existingReferral = await this.referralRepo.findOne({
      where: { referredUserId },
    });

    if (existingReferral) {
      throw new AppError(400, "User has already used a referral code");
    }

    // Create referral record
    const referral = this.referralRepo.create({
      referrerId: referralCode.userId,
      referredUserId,
      referralCodeUsed: code,
      status: ReferralStatus.PENDING,
      rewardEarnedReferrer: {
        type: RewardType.POINTS,
        value: 100,
        description: "Referral bonus for bringing a new user",
      },
      rewardEarnedReferred: {
        type: RewardType.POINTS,
        value: 50,
        description: "Welcome bonus for joining through referral",
      },
    });

    const savedReferral = await this.referralRepo.save(referral);

    // Update referral code usage count
    await this.repository.update(referralCode.id, {
      usageCount: referralCode.usageCount + 1,
    });

    return savedReferral;
  }

  // Complete referral (when referred user meets criteria)
  async completeReferral(
    referralId: string,
    completionTrigger: string = "profile_completed"
  ): Promise<Referral> {
    const referral = await this.referralRepo.findOne({
      where: { id: referralId },
      relations: ["referrer", "referredUser"],
    });

    if (!referral) {
      throw new AppError(404, "Referral not found");
    }

    if (referral.status !== ReferralStatus.PENDING) {
      throw new AppError(400, "Referral is not in pending status");
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

    return this.referralRepo.save(referral);
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
      relations: ["referredUser", "referralCode"],
      order: { createdAt: "DESC" },
    });

    const referralReceived = await this.referralRepo.findOne({
      where: { referredUserId: userId },
      relations: ["referrer", "referralCode"],
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
    limit: number = 10
  ): Promise<{
    items: Referral[];
    total: number;
  }> {
    const [items, total] = await this.referralRepo.findAndCount({
      relations: ["referrer", "referredUser", "referralCode"],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return { items, total };
  }

  // Admin: Manually complete referral
  async adminCompleteReferral(
    referralId: string,
    adminNotes?: string
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
      throw new AppError(404, "Referral code not found");
    }

    code.isActive = false;
    return this.repository.save(code);
  }

  // Get referral statistics
  async getReferralStatistics(): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewardsDistributed: number;
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
      0
    );

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
        })
      )
    ).filter(
      (
        result
      ): result is { userId: string; referralCount: number; user: User } =>
        result !== null
    );

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewardsDistributed,
      topReferrers,
    };
  }
}
