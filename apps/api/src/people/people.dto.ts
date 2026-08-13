import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional() @IsString() preferredName?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() sex?: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsString() conditions?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsString() physician?: string;
  @IsOptional() @IsString() physicianPhone?: string;
  @IsOptional() @IsString() pharmacy?: string;
  @IsOptional() @IsString() pharmacyPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() color?: string;
}

export class UpdatePersonDto extends CreatePersonDto {
  @IsOptional() @IsString() @MinLength(1) override name?: string;
}

export class CreateContactDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}
