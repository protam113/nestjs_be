import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { BlogStatus } from '../blog.constant';

export class CreateBlogDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  category?: string[];

  status?: BlogStatus; // Add this optional field
}
