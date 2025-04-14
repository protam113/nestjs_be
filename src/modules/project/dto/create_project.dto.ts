import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  brand_name: string;

  @IsNotEmpty()
  @IsString()
  testimonial: string;

  @IsString()
  client: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  link?: string;
}
