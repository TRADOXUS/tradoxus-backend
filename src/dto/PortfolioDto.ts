import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max } from "class-validator"
import { TransactionType, TransactionStatus } from "../entities/Transaction"

export class CreateTransactionDto {
  @IsString()
  asset: string

  @IsEnum(TransactionType)
  type: TransactionType

  @IsNumber()
  @Min(0)
  amount: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number

  @IsOptional()
  @IsString()
  txHash?: string

  @IsOptional()
  metadata?: Record<string, any>
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus

  @IsOptional()
  @IsString()
  txHash?: string

  @IsOptional()
  metadata?: Record<string, any>
}

export class PortfolioQueryDto {
  @IsOptional()
  @IsString()
  asset?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0
}

export interface AssetBalance {
  asset: string
  available: number
  locked: number
  total: number
  averageCost: number
  currentPrice: number
  totalValue: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercentage: number
  balances: AssetBalance[]
  allocation: Array<{
    asset: string
    value: number
    percentage: number
  }>
}

export interface TransactionSummary {
  id: string
  asset: string
  type: TransactionType
  amount: number
  price: number | null
  fee: number | null
  status: TransactionStatus
  totalValue: number
  createdAt: Date
  txHash: string | null
}

export interface PortfolioResponse {
  summary: PortfolioSummary
  recentTransactions: TransactionSummary[]
  lastUpdated: Date
}
