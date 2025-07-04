import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
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
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  referrerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "referrerId" })
  referrer: User;

  @Column({ type: "uuid" })
  referredUserId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "referredUserId" })
  referredUser: User;

  @Column({ type: "varchar", length: 20 })
  referralCodeUsed: string;

  @ManyToOne(() => ReferralCode)
  @JoinColumn({ name: "referralCodeUsed", referencedColumnName: "code" })
  referralCode: ReferralCode;

  @Column({
    type: "enum",
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @Column({ type: "jsonb", nullable: true })
  rewardEarnedReferrer: ReferralReward;

  @Column({ type: "jsonb", nullable: true })
  rewardEarnedReferred: ReferralReward;

  @Column({ type: "boolean", default: false })
  referrerRewardClaimed: boolean;

  @Column({ type: "boolean", default: false })
  referredRewardClaimed: boolean;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: {
    completionTrigger?: string;
    referrerPoints?: number;
    referredPoints?: number;
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
