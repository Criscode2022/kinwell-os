import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['pharmacy', 'transport', 'paperwork', 'home', 'medical']) category?: string;
  @IsOptional() @IsString() dueOn?: string;
  @IsOptional() @IsIn(['open', 'doing', 'done']) status?: string;
  @IsOptional() @IsString() assignedTo?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['pharmacy', 'transport', 'paperwork', 'home', 'medical']) category?: string;
  @IsOptional() @IsString() dueOn?: string;
  @IsOptional() @IsIn(['open', 'doing', 'done']) status?: string;
  @IsOptional() @IsString() assignedTo?: string;
}
