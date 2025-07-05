import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";

export class AssetAllocationDto {
  @IsString()
  asset: string;

  @IsNumber()
  value: number;

  @IsNumber()
  percentage: number;

  @IsNumber()
  weight: number;
}

export class AllocationDto {
  @IsString()
  asset: string;

  @IsNumber()
  value: number;

  @IsNumber()
  percentage: number;

  @IsString()
  color: string;
}

export class PortfolioSummaryDto {
  @IsNumber()
  totalValue: number;

  @IsNumber()
  totalPnL: number;

  @IsNumber()
  totalPnLPercentage: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocation: AllocationDto[];

  @IsOptional()
  @IsNumber()
  diversificationScore?: number;

  @IsOptional()
  @IsNumber()
  sharpeRatio?: number;

  @IsOptional()
  @IsNumber()
  maxDrawdown?: number;

  @IsOptional()
  @IsNumber()
  cagr?: number;
}

export class AssetBalanceDto {
  @IsString()
  asset: string;

  @IsNumber()
  available: number;

  @IsNumber()
  locked: number;

  @IsNumber()
  total: number;

  @IsNumber()
  currentValue: number;

  @IsOptional()
  @IsNumber()
  averageCost?: number;

  @IsOptional()
  @IsNumber()
  unrealizedPnL?: number;

  @IsOptional()
  @IsNumber()
  realizedPnL?: number;

  @IsOptional()
  @IsNumber()
  totalPnL?: number;

  @IsNumber()
  currentPrice: number;
}

export class TransactionDto {
  @IsUUID()
  id: string;

  @IsEnum([
    "BUY",
    "SELL",
    "DEPOSIT",
    "WITHDRAWAL",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "REWARD",
    "FEE",
  ])
  type: string;

  @IsEnum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"])
  status: string;

  @IsString()
  asset: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  createdAt: Date;
}

export class PortfolioPerformanceDto {
  @IsNumber()
  currentValue: number;

  @IsNumber()
  previousValue: number;

  @IsNumber()
  absoluteChange: number;

  @IsNumber()
  percentageChange: number;

  @IsEnum(["day", "week", "month", "year"])
  period: string;
}

export class PortfolioHistoryDto {
  @IsArray()
  timestamps: Date[];

  @IsArray()
  values: number[];

  @IsEnum(["day", "week", "month", "year"])
  period: string;

  @IsNumber()
  totalReturn: number;

  @IsNumber()
  volatility: number;
}

export class CreateTransactionDto {
  @IsEnum([
    "BUY",
    "SELL",
    "DEPOSIT",
    "WITHDRAWAL",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "REWARD",
    "FEE",
  ])
  type: string;

  @IsString()
  asset: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
