import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class ApplyReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  code: string;
}

export class CompleteReferralDto {
  @IsString()
  @IsOptional()
  trigger?: string;
}

export class AdminCompleteReferralDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
