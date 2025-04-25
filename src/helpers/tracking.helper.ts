import { Type } from 'src/modules/tracking/responses/data.response';

export function buildTrackingFilter(params: {
  startDate?: string;
  endDate?: string;
  type?: Type | 'all'; // ✅ fix here
  sort?: 'asc' | 'desc';
}): { filter: Record<string, any>; sortCondition: Record<string, any> } {
  const { startDate, endDate, type, sort } = params;
  const filter: Record<string, any> = {};

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (type && type !== 'all') {
    filter.type = type;
  }

  const sortDirection = sort === 'asc' ? 1 : -1;
  const sortCondition = { views: sortDirection };

  return { filter, sortCondition };
}
