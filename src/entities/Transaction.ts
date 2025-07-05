import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  REWARD = "REWARD",
  FEE = "FEE",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

@Entity("transactions")
@Index(["userId", "createdAt"])
@Index(["userId", "asset"])
@Index(["userId", "type"])
@Index(["userId", "status"])
@Index(["txHash"])
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ type: "varchar", length: 20 })
  asset!: string;

  @Column({ type: "decimal", precision: 28, scale: 8 })
  amount!: string;

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  price!: string | null;

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  fee!: string | null;

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  totalValue!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  txHash!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
