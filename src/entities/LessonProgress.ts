import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Lesson } from './Lesson';
import { InteractionEventData } from '../dto/LessonProgress.dto';

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

@Entity()
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Lesson)
  lesson: Lesson;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.NOT_STARTED
  })
  status: ProgressStatus;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ default: 0 })
  timeSpent: number; // in seconds

  @Column({ type: 'timestamp', nullable: true })
  lastInteractionAt: Date;

  @Column({ type: 'float', default: 0 })
  completionPercentage: number;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    capsuleProgress: Record<string, boolean>;
    exerciseResults: Record<string, number>;
    interactionEvents: Array<{
      type: string;
      timestamp: Date;
      data: InteractionEventData;
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 