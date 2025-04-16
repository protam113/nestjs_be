import { TrackingDocument } from 'src/entities/tracking.entity';
import { TrackingResponseDto, Type } from './responses/data.response';

export function toDataResponse(
  tracking: Partial<TrackingDocument>
): TrackingResponseDto {
  return {
    _id: tracking._id?.toString() ?? '',
    postId: tracking.postId ?? '',
    title: tracking.title ?? '',
    slug: tracking.slug ?? '',
    type: tracking.type ?? Type.BLOG, // Dùng Type.BLOG vì Type đã được định nghĩa đúng
    views: tracking.views || 0,
    byDevice: tracking.byDevice ?? {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    },
    createdAt: tracking.createdAt || new Date(),
    updatedAt: tracking.updatedAt || new Date(),
  };
}
