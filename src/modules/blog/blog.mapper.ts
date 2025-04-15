import { BlogDocument } from 'src/entities/blog.entity';
import { BlogStatus } from './blog.constant';
import { DataResponse } from './responses/data.response';

export function toDataResponse(blog: Partial<BlogDocument>): DataResponse {
  return {
    _id: blog._id?.toString() ?? '',
    title: blog.title ?? '',
    slug: blog.slug ?? '',
    content: blog.content ?? '',
    file: blog.file ?? '',
    description: blog.description ?? '',
    status: blog.status as BlogStatus,
    category: {
      _id: blog.category?._id?.toString() ?? '',
      name: blog.category?.name ?? '',
    },
    createdAt: blog.createdAt ?? new Date(),
    updatedAt: blog.updatedAt ?? new Date(),
  };
}
