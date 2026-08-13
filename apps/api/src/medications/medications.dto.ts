import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateMedicationDto {
  @IsString() @MinLength(1) personId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() genericName?: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() form?: string;
  @IsOptional() @IsIn(['daily', 'twice_daily', 'three_daily', 'weekly', 'as_needed']) frequency?: string;
  @IsOptional() @IsString() times?: string;
  @IsOptional() @IsBoolean() withFood?: boolean;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() prescriber?: string;
  @IsOptional() @IsInt() @Min(0) quantity?: number;
  @IsOptional() @IsInt() @Min(0) refillsLeft?: number;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateMedicationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() genericName?: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() form?: string;
  @IsOptional() @IsIn(['daily', 'twice_daily', 'three_daily', 'weekly', 'as_needed']) frequency?: string;
  @IsOptional() @IsString() times?: string;
  @IsOptional() @IsBoolean() withFood?: boolean;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() prescriber?: string;
  @IsOptional() @IsInt() @Min(0) quantity?: number;
  @IsOptional() @IsInt() @Min(0) refillsLeft?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class LogDoseDto {
  @IsString() @MinLength(1) medicationId!: string;
  @IsIn(['taken', 'skipped', 'missed']) status!: string;
  @IsOptional() @IsString() scheduledFor?: string;
  @IsOptional() @IsString() note?: string;
}
