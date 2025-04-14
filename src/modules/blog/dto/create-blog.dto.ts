import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
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

  @IsString()
  @IsOptional()
  category?: string;

  status?: BlogStatus; // Add this optional field
}
