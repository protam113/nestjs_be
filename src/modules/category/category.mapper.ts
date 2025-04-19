import { CategoryDocument } from 'src/entities/category.entity';
import { DataResponse } from './responses/data.response';
import { CategoryStatus } from './category.constant';

export function toDataResponse(
  category: Partial<CategoryDocument>
): DataResponse {
  return {
    _id: category._id?.toString() ?? '',
    name: category.name ?? '',
    slug: category.slug ?? '',
    user: category.user ?? {},
    status: category.status as CategoryStatus,
    createdAt: category.createdAt || new Date(),
    updatedAt: category.updatedAt || new Date(),
  };
}
