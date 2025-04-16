import { ProjectDocument } from 'src/entities/project.entity';
import { DataResponse } from './responses/data.response';
import { ProjectStatus } from './project.constant';

export function toDataResponse(
  project: Partial<ProjectDocument>
): DataResponse {
  return {
    _id: project._id?.toString() ?? '',
    title: project.title ?? '',
    slug: project.slug ?? '',
    file: project.file ?? '',
    content: project.content ?? '',
    description: project.description ?? '',
    // Map service to an array of objects with _id and title
    service: (project.service ?? []).map((s: any) => ({
      _id: s._id?.toString() ?? '', // Ensure _id is a string
      title: s.title ?? '', // Ensure title is a string
    })),
    user: project.user ?? {},
    link: project.link ?? '',
    brand_name: project.brand_name ?? '',
    views: project.views ?? 0,
    client: project.client ?? '',
    testimonial: project.testimonial ?? '',
    status: project.status as ProjectStatus,
    createdAt: project.createdAt || new Date(),
    updatedAt: project.updatedAt || new Date(),
  };
}
