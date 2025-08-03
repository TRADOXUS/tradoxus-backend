import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { IsNotEmpty, IsString, Length, IsUUID } from "class-validator";
import { User } from "./User";
import { StrategyRule } from "./StrategyRule";
import { StrategyCheckpoint } from "./StrategyCheckpoint";

@Entity("strategies")
export class Strategy {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @IsUUID()
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user!: User;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name!: string;

  @Column({ type: "text", nullable: true })
  @IsString()
  description?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  @IsString()
  assetClass?: string;

  @OneToMany(() => StrategyRule, (rule) => rule.strategy, { cascade: true })
  rules!: StrategyRule[];

  @OneToMany(() => StrategyCheckpoint, (checkpoint) => checkpoint.strategy, {
    cascade: true,
  })
  checkpoints!: StrategyCheckpoint[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
