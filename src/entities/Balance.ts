import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("balances")
@Index(["userId", "asset"], { unique: true })
@Index(["userId"])
@Index(["asset"])
export class Balance {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid" })
  userId!: string

  @Column({ type: "varchar", length: 20 })
  asset!: string

  @Column({ type: "decimal", precision: 28, scale: 8, default: "0" })
  available!: string

  @Column({ type: "decimal", precision: 28, scale: 8, default: "0" })
  locked!: string

  @Column({ type: "decimal", precision: 28, scale: 8, default: "0" })
  total!: string

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  averageCost!: string | null

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  unrealizedPnL!: string | null

  @Column({ type: "decimal", precision: 28, scale: 8, nullable: true })
  realizedPnL!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
