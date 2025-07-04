import { IsString, IsNotEmpty, Length, IsOptional } from "class-validator";

export class ApplyReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  code: string;
}

export class CompleteReferralDto {
  @IsString()
  @IsOptional()
  @Length(1, 500)
  trigger?: string;
}

export class AdminCompleteReferralDto {
  @IsString()
  @IsOptional()
  @Length(1, 1000)
  notes?: string;
}
