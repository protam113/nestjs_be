import { CategoryStatus } from 'src/modules/category/category.constant';

export function buildCategoryFilter(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Record<string, any> {
  const { startDate, endDate, status } = params;
  const filter: Record<string, any> = {};

  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (status) {
    const statusArray = status.split(',');
    const validStatuses = statusArray.filter((s) =>
      Object.values(CategoryStatus).includes(s as CategoryStatus)
    );
    if (validStatuses.length > 0) {
      filter.status = { $in: validStatuses };
    }
  }

  return filter;
}
