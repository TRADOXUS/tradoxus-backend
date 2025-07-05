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

@Entity("referral_codes")
// Compound indexes for common query patterns
@Index(["userId", "isActive"]) // For finding user's active codes
@Index(["isActive", "expiresAt"]) // For finding active non-expired codes
@Index(["isActive", "usageCount", "maxUsage"]) // For finding available codes
@Index(["createdAt", "isActive"]) // For time-based active code queries
@Index(["usageCount", "maxUsage"]) // For usage analytics
export class ReferralCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 20, unique: true })
  @Index()
  code: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "boolean", default: true })
  @Index()
  isActive: boolean;

  @Column({ type: "int", default: 0 })
  usageCount: number;

  @Column({ type: "int", default: 100 })
  maxUsage: number;

  @Column({ type: "timestamp", nullable: true })
  @Index()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
