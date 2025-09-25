import {
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { RuleType } from "../entities/StrategyRule";
import { CheckpointCategory } from "../entities/StrategyCheckpoint";

export class CreateStrategyConditionDto {
  @IsNotEmpty()
  @IsString()
  indicator!: string;

  @IsNotEmpty()
  @IsString()
  operator!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  timeFrame?: string;
}

export class CreateStrategyRuleDto {
  @IsNotEmpty()
  @IsEnum(RuleType)
  ruleType!: RuleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStrategyConditionDto)
  conditions!: CreateStrategyConditionDto[];
}

export class CreateStrategyCheckpointDto {
  @IsNotEmpty()
  @IsString()
  text!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsNotEmpty()
  @IsEnum(CheckpointCategory)
  category!: CheckpointCategory;
}

export class CreateStrategyDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assetClass?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStrategyRuleDto)
  rules!: CreateStrategyRuleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStrategyCheckpointDto)
  checkpoints!: CreateStrategyCheckpointDto[];
}

export class UpdateStrategyDto extends CreateStrategyDto {}
