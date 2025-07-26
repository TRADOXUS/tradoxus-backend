import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "./User";

@Entity("economic_events")
export class EconomicEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @PrimaryGeneratedColumn("uuid")
  eventId!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "time" })
  time!: Date; 

  @Column({ type: "varchar", length: 100 })
  country!: string;

  @Column({ type: "varchar", length: 255 })
  eventName!: string;

  @Column({ type: "varchar", length: 50 })
  importanceLevel!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  currencyAffected!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  previousValue!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  forecastValue!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  actualValue!: string | null;

  @Column({ type: "text", nullable: true }) 
  description!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => EventImpactAnalysis, analysis => analysis.economicEvent)
  impactAnalyses!: EventImpactAnalysis[];

  @OneToMany(() => UserEventAlert, alert => alert.economicEvent)
  userAlerts!: UserEventAlert[];
}

@Entity("event_impact_analysis")
export class EventImpactAnalysis {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @PrimaryGeneratedColumn("uuid")
  analysisId!: string;

  @Column({ type: "uuid" })
  eventId!: string;

  @ManyToOne(() => EconomicEvent, event => event.impactAnalyses)
  @JoinColumn({ name: "eventId" }) 
  economicEvent!: EconomicEvent;

  @Column({ type: "varchar", length: 100, nullable: true }) 
  assetClass!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  expectedImpactDirection!: string | null;

  @Column({ type: "integer", nullable: true })
  confidenceLevel!: number | null;

  @Column({ type: "text", nullable: true })
  analysisNotes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity("user_event_alerts")
@Index(["userId"])
@Index(["eventId"])
export class UserEventAlert {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @PrimaryGeneratedColumn("uuid")
  alertId!: string;

  @Column({ type: "uuid" })
  userId!: string; 

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: "userId" })
  User!: unknown;

  @Column({ type: "uuid" })
  eventId!: string; 

  @ManyToOne(() => EconomicEvent, event => event.userAlerts)
  @JoinColumn({ name: "eventId" })
  economicEvent!: EconomicEvent;

  @Column({ type: "integer" })
  alertTimeBefore!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}