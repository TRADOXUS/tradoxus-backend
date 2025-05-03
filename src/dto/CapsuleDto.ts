import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
} from "class-validator";

export enum CapsuleType {
  VIDEO = "video",
  TEXT = "text",
  QUIZ = "quiz",
  ASSIGNMENT = "assignment",
}

export class CreateCapsuleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CapsuleType)
  type: CapsuleType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @IsOptional()
  lessonId?: number;
}

export class UpdateCapsuleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CapsuleType)
  @IsOptional()
  type?: CapsuleType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  prerequisiteIds?: number[];
}
