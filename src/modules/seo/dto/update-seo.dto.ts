import {
  IsString,
  IsArray,
  IsOptional,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  site_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  site_description?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  keywords?: string[];

  @IsOptional()
  @IsString()
  google_analytics_id?: string;

  @IsOptional()
  @IsString()
  gtm_id?: string;

  @IsOptional()
  @IsString()
  facebook_pixel_id?: string;

  @IsOptional()
  @IsString()
  search_console_verification?: string;
}
