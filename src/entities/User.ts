import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsEthereumAddress, Length, IsEmail, IsOptional, IsBoolean } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  @IsNotEmpty({ message: 'Nickname is required' })
  @Length(3, 50, { message: 'Nickname must be between 3 and 50 characters' })
  nickname: string;

  @Column({ length: 42, unique: true })
  @IsNotEmpty({ message: 'Wallet address is required' })
  @IsEthereumAddress({ message: 'Invalid Ethereum address format' })
  walletAddress: string;

  @Column({ length: 255, unique: true, nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;
}