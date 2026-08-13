import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() @MinLength(1) personId!: string;
  @IsString() @MinLength(1) title!: string;
  @IsString() startsAt!: string;
  @IsOptional() @IsString() endsAt?: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsIn(['gp', 'specialist', 'lab', 'therapy', 'other']) kind?: string;
  @IsOptional() @IsIn(['scheduled', 'completed', 'cancelled', 'no_show']) status?: string;
  @IsOptional() @IsString() prepNotes?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsString() endsAt?: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsIn(['gp', 'specialist', 'lab', 'therapy', 'other']) kind?: string;
  @IsOptional() @IsIn(['scheduled', 'completed', 'cancelled', 'no_show']) status?: string;
  @IsOptional() @IsString() prepNotes?: string;
  @IsOptional() @IsString() notes?: string;
}
