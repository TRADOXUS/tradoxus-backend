import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  PENDING = 'pending',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  PARTIALLY_FILLED = 'partially_filled'
}

export class CreateOrderDto {
  @IsString()
  symbol: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsUUID()
  userId: string;
}

export class OrderResponseDto {
  id: string;
  symbol: string;
  type: OrderType;
  amount: number;
  price: number;
  status: OrderStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  filledAmount?: number;
  filledPrice?: number;
}

export class GetUserOrdersDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class MarketTickerDto {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export class OrderBookEntryDto {
  price: number;
  amount: number;
  total: number;
}

export class OrderBookDto {
  symbol: string;
  bids: OrderBookEntryDto[];
  asks: OrderBookEntryDto[];
  timestamp: Date;
}

export class GetOrderBookDto {
  @IsString()
  symbol: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  depth?: number = 20;
}