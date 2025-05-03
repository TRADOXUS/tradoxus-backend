import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsNotEmpty,
  Length,
  Min,
} from "class-validator";

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequisites?: string[];

  @IsString()
  @IsNotEmpty()
  moduleId: string;
}

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  @Length(3, 100)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequisites?: string[];
}
