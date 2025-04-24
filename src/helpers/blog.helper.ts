import { BlogStatus } from 'src/modules/blog/blog.constant';

export function buildBlogFilter(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
}): Record<string, any> {
  const { startDate, endDate, status, category } = params;
  const filter: Record<string, any> = {};

  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (status) {
    const statusArray = status.split(',');
    const validStatuses = statusArray.filter((s) =>
      Object.values(BlogStatus).includes(s as BlogStatus)
    );
    if (validStatuses.length > 0) {
      filter.status = { $in: validStatuses };
    }
  }

  if (category) {
    filter.category = category;
  }

  return filter;
}
