import { CategoryDocument } from 'src/entities/category.entity';

export interface CreateCategoryResponse {
  status: string;
  result: CategoryDocument;
}
