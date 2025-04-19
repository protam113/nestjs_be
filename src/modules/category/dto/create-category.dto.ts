import { IsNotEmpty, IsString } from 'class-validator';
import { CategoryStatus } from '../category.constant';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  status?: CategoryStatus;
}
