import {
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsUUID,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class CalendarQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((country) => country.trim());
    }
    return value;
  })
  countries?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((importance) => importance.trim());
    }
    return value;
  })
  @IsIn(["Low", "Medium", "High", "Critical"], { each: true })
  importance?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((currency) => currency.trim());
    }
    return value;
  })
  currencies?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class UpcomingEventsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  @Type(() => Number)
  hours?: number = 24;
}

export class CreateAlertDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  @IsString()
  userId: string;

  @IsInt()
  @Min(5)
  @Max(10080)
  alertTimeBefore: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class ImpactAnalysisDto {
  @IsUUID()
  eventId: string;

  @IsString()
  assetClass: string;

  @IsString()
  @IsIn(["Bullish", "Bearish", "Neutral", "Mixed"])
  expectedImpactDirection: string;

  @IsInt()
  @Min(1)
  @Max(10)
  confidenceLevel: number;

  @IsOptional()
  @IsString()
  analysisNotes?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  alertTimeBefore?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AlertQueryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value === "true";
    }
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
