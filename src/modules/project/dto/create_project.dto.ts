import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  )
  service: string[];

  @IsNotEmpty()
  @IsString()
  client: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  link?: string;
}
