import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
} from "class-validator";
import { Strategy } from "./Strategy";

export enum CheckpointCategory {
  PRE_TRADE = "pre-trade",
  POST_TRADE = "post-trade",
}

@Entity("strategy_checkpoints")
export class StrategyCheckpoint {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @IsUUID()
  strategyId!: string;

  @ManyToOne(() => Strategy, (strategy) => strategy.checkpoints, {
    onDelete: "CASCADE",
  })
  strategy!: Strategy;

  @Column({ type: "text" })
  @IsNotEmpty()
  @IsString()
  text!: string;

  @Column({ type: "int" })
  @IsInt()
  @Min(0)
  order!: number;

  @Column({ type: "enum", enum: CheckpointCategory })
  @IsEnum(CheckpointCategory)
  category!: CheckpointCategory;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
