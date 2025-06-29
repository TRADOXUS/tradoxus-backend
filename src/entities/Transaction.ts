import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm"
import { User } from "./User"

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

@Entity("transactions")
@Index(["userId", "status"])
@Index(["asset", "createdAt"])
@Index(["userId", "asset", "status"])
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  userId: string

  @ManyToOne(
    () => User,
    (user) => user.id,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user: User

  @Column({ type: "varchar", length: 20 })
  asset: string // XLM, USDC, etc.

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType

  @Column({ type: "decimal", precision: 20, scale: 7 })
  amount: string

  @Column({ type: "decimal", precision: 20, scale: 7, nullable: true })
  price: string // Price per unit in USD

  @Column({ type: "decimal", precision: 20, scale: 7, nullable: true })
  fee: string

  @Column({ type: "enum", enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus

  @Column({ type: "varchar", length: 255, nullable: true })
  txHash: string // Blockchain transaction hash

  @Column({ type: "text", nullable: true })
  metadata: string // JSON string for additional data

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Virtual properties for calculations
  get totalValue(): number {
    if (!this.price) return 0
    return Number.parseFloat(this.amount) * Number.parseFloat(this.price)
  }

  get netAmount(): number {
    const amount = Number.parseFloat(this.amount)
    const fee = this.fee ? Number.parseFloat(this.fee) : 0

    if (this.type === TransactionType.BUY || this.type === TransactionType.DEPOSIT) {
      return amount - fee
    }
    return amount + fee
  }
}
