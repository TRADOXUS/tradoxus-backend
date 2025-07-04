import { 
  IsString, 
  IsNotEmpty, 
  Length, 
  IsOptional, 
  IsUUID, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  IsBoolean,
  Matches,
  IsDateString,
  ValidateIf
} from "class-validator";

export class ApplyReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must contain only uppercase letters and numbers' })
  code: string;
}

export class CompleteReferralDto {
  @IsString()
  @IsOptional()
  @Length(1, 500)
  trigger?: string;

  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}

export class AdminCompleteReferralDto {
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  forceComplete?: boolean;
}

export class GenerateReferralCodeDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  maxUsage?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(3650) // Max 10 years
  expiryDays?: number;

  @IsString()
  @IsOptional()
  @Length(8, 20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Custom code must contain only uppercase letters and numbers' })
  customCode?: string;
}

export class UpdateReferralCodeDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxUsage?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ReferralAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  @Matches(/^(7d|30d|90d|1y)$/, { message: 'Period must be 7d, 30d, 90d, or 1y' })
  period?: string = "30d";

  @IsEnum(["day", "week", "month"])
  @IsOptional()
  timeFrame?: "day" | "week" | "month" = "day";

  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class PaginationDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @IsString()
  @IsOptional()
  @IsEnum(["createdAt", "status", "completedAt", "usageCount"])
  sortBy?: string = "createdAt";
}

export class ReferralFilterDto {
  @IsEnum(["PENDING", "COMPLETED", "EXPIRED", "CANCELLED"])
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  referrerId?: string;

  @IsUUID()
  @IsOptional()
  referredUserId?: string;

  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @IsDateString()
  @IsOptional()
  completedAfter?: string;

  @IsDateString()
  @IsOptional()
  completedBefore?: string;

  @IsBoolean()
  @IsOptional()
  rewardsClaimed?: boolean;
}

export class BulkReferralActionDto {
  @IsUUID(4, { each: true })
  @IsNotEmpty()
  referralIds: string[];

  @IsEnum(["complete", "cancel", "reactivate"])
  action: "complete" | "cancel" | "reactivate";

  @IsString()
  @IsOptional()
  @Length(1, 1000)
  reason?: string;

  @IsBoolean()
  @IsOptional()
  notifyUsers?: boolean = false;
}

export class ClaimRewardDto {
  @IsUUID()
  referralId: string;

  @IsEnum(["referrer", "referred"])
  rewardType: "referrer" | "referred";

  @IsString()
  @IsOptional()
  @Length(1, 500)
  notes?: string;
}

// Response DTOs for type safety
export class ReferralCodeResponseDto {
  id: string;
  code: string;
  userId: string;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
  expiresAt: Date | null;
  shareUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReferralResponseDto {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCodeUsed: string;
  status: string;
  rewardEarnedReferrer: any;
  rewardEarnedReferred: any;
  referrerRewardClaimed: boolean;
  referredRewardClaimed: boolean;
  completedAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export class ReferralStatsResponseDto {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsDistributed: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    referralCount: number;
    user: any;
  }>;
  recentActivity: Array<{
    date: string;
    referrals: number;
    completions: number;
  }>;
}

export class UserReferralStatusResponseDto {
  referralCode: ReferralCodeResponseDto | null;
  referralsMade: ReferralResponseDto[];
  referralReceived: ReferralResponseDto | null;
  totalRewardsEarned: number;
  totalRewardsClaimed: number;
  pendingRewards: number;
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
  };
}
