import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { StrategyRule } from "./StrategyRule";

@Entity("strategy_conditions")
export class StrategyCondition {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @IsUUID()
  ruleId!: string;

  @ManyToOne(() => StrategyRule, (rule) => rule.conditions, { onDelete: "CASCADE" })
  rule!: StrategyRule;

  @Column({ type: "varchar", length: 50 })
  @IsNotEmpty()
  @IsString()
  indicator!: string;

  @Column({ type: "varchar", length: 20 })
  @IsNotEmpty()
  @IsString()
  operator!: string;

  @Column({ type: "varchar", length: 50 })
  @IsNotEmpty()
  @IsString()
  value!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  @IsString()
  timeFrame?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 