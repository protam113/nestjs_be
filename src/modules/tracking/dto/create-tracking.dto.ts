import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTrackingDto {
  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsEnum(['blog', 'project', 'service'])
  @IsNotEmpty()
  type: 'blog' | 'project' | 'service';

  @IsOptional()
  @IsString()
  byDevice: string;
}
