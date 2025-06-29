import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm"
import { User } from "./User"

@Entity("balances")
@Unique(["userId", "asset"])
@Index(["userId"])
@Index(["asset"])
export class Balance {
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
  asset: string

  @Column({ type: "decimal", precision: 20, scale: 7, default: "0" })
  available: string // Available balance

  @Column({ type: "decimal", precision: 20, scale: 7, default: "0" })
  locked: string // Locked in orders

  @Column({ type: "decimal", precision: 20, scale: 7, default: "0" })
  averageCost: string // Average cost basis in USD

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Virtual properties
  get total(): number {
    return Number.parseFloat(this.available) + Number.parseFloat(this.locked)
  }

  get totalValue(): number {
    return this.total * Number.parseFloat(this.averageCost)
  }
}
