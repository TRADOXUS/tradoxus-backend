import { IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @Length(3, 50, { message: 'Nickname must be between 3 and 50 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Nickname must be alphanumeric with underscores only' })
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}

export class UserProfileDto {
  id: string;
  nickname: string;
  walletAddress: string;
  email: string | null;
  createdAt: Date;
  lastLogin: Date | null;
}