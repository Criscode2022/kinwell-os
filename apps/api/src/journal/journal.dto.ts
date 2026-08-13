import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateJournalDto {
  @IsString() @MinLength(1) personId!: string;
  @IsOptional() @IsString() entryDate?: string;
  @IsOptional() @IsIn(['good', 'ok', 'low', 'unwell']) mood?: string;
  @IsOptional() @IsIn(['good', 'ok', 'low']) appetite?: string;
  @IsOptional() @IsIn(['good', 'ok', 'poor', 'restless']) sleep?: string;
  @IsOptional() @IsString() body?: string;
}

export class UpdateJournalDto {
  @IsOptional() @IsIn(['good', 'ok', 'low', 'unwell']) mood?: string;
  @IsOptional() @IsIn(['good', 'ok', 'low']) appetite?: string;
  @IsOptional() @IsIn(['good', 'ok', 'poor', 'restless']) sleep?: string;
  @IsOptional() @IsString() body?: string;
}
