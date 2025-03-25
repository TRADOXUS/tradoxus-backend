import { IsNotEmpty, IsString, Length, IsOptional, IsBoolean } from 'class-validator';

export class CreateCourseDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 100)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;
}

export class UpdateCourseDto extends CreateCourseDto {} 