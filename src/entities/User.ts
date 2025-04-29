import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LessonProgress } from './LessonProgress';
import { IsEmail, IsOptional } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @IsOptional()
  @IsEmail()
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 42, unique: true, nullable: true })
  walletAddress: string | null;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => LessonProgress, progress => progress.userId)
  lessonProgress: LessonProgress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
