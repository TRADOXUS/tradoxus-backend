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
@Index(["userId", "isActive"])
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
