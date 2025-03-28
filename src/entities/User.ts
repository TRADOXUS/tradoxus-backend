import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  nickname: string;

  @Column({ length: 42, unique: true })
  walletAddress: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ default: true })
  isActive: boolean;
}