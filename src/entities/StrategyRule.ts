import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { IsNotEmpty, IsString, IsEnum, IsUUID } from "class-validator";
import { Strategy } from "./Strategy";
import { StrategyCondition } from "./StrategyCondition";

export enum RuleType {
  ENTRY = "entry",
  EXIT = "exit",
  RISK_MANAGEMENT = "risk_management",
}

@Entity("strategy_rules")
export class StrategyRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @IsUUID()
  strategyId!: string;

  @ManyToOne(() => Strategy, (strategy) => strategy.rules, {
    onDelete: "CASCADE",
  })
  strategy!: Strategy;

  @Column({ type: "enum", enum: RuleType })
  @IsEnum(RuleType)
  ruleType!: RuleType;

  @Column({ type: "text", nullable: true })
  @IsString()
  description?: string;

  @OneToMany(() => StrategyCondition, (condition) => condition.rule, {
    cascade: true,
  })
  conditions!: StrategyCondition[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
