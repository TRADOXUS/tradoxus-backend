import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { ReferralCode } from "./ReferralCode";

export enum ReferralStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum RewardType {
  POINTS = "POINTS",
  DISCOUNT = "DISCOUNT",
  PREMIUM_ACCESS = "PREMIUM_ACCESS",
  COURSE_ACCESS = "COURSE_ACCESS",
}

export interface ReferralReward {
  type: RewardType;
  value: number;
  description: string;
}

@Entity("referrals")
// Compound indexes for common query patterns
@Index(["referrerId", "status"]) // For finding user's referrals by status
@Index(["referredUserId", "status"]) // For finding if user was referred and status
@Index(["status", "createdAt"]) // For filtering by status and ordering by creation date
@Index(["status", "completedAt"]) // For filtering completed referrals by completion date
@Index(["referrerId", "createdAt"]) // For user's referral history ordered by date
@Index(["referralCodeUsed", "status"]) // For code performance analytics
@Index(["completedAt", "status"]) // For time-based completion queries
@Index(["referrerRewardClaimed", "status"]) // For unclaimed rewards queries
@Index(["referredRewardClaimed", "status"]) // For unclaimed rewards queries
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index() // Single index for referrer lookups
  referrerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "referrerId" })
  referrer: User;

  @Column({ type: "uuid" })
  @Index() // Single index for referred user lookups
  referredUserId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "referredUserId" })
  referredUser: User;

  @Column({ type: "varchar", length: 20 })
  @Index() // Index for referral code lookups
  referralCodeUsed: string;

  @ManyToOne(() => ReferralCode)
  @JoinColumn({ name: "referralCodeUsed", referencedColumnName: "code" })
  referralCode: ReferralCode;

  @Column({
    type: "enum",
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  @Index() // Index for status filtering
  status: ReferralStatus;

  @Column({ type: "jsonb", nullable: true })
  rewardEarnedReferrer: ReferralReward;

  @Column({ type: "jsonb", nullable: true })
  rewardEarnedReferred: ReferralReward;

  @Column({ type: "boolean", default: false })
  @Index() // Index for reward claim status
  referrerRewardClaimed: boolean;

  @Column({ type: "boolean", default: false })
  @Index() // Index for reward claim status
  referredRewardClaimed: boolean;

  @Column({ type: "timestamp", nullable: true })
  @Index() // Index for completion date queries
  completedAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: {
    completionTrigger?: string;
    referrerPoints?: number;
    referredPoints?: number;
    notes?: string;
    adminId?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  @CreateDateColumn()
  @Index() // Index for creation date ordering
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
