import { Injectable } from '@nestjs/common';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { CreateTrackingResponse } from './responses/create_tracking.response';
import { BlogService } from '../blog/blog.service';
import { ServiceService } from '../service/service.service';
import { ProjectService } from '../project/project.service';
import { Model } from 'mongoose';
import { TrackingDocument, TrackingEntity } from 'src/entities/tracking.entity';
import { InjectModel } from '@nestjs/mongoose';
import { StatusType } from '../../entities/status_code.entity';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { Pagination } from '../paginate/pagination';
import { TrackingResponseDto, Type } from './responses/data.response';
import { toDataResponse } from './tracking.mapper';
import { buildTrackingFilter } from 'src/helpers/tracking.helper';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(TrackingEntity.name)
    private readonly trackingModel: Model<TrackingDocument>,
    private readonly redisCacheService: RedisCacheService,
    private readonly blogService: BlogService,
    private readonly serviceService: ServiceService,
    private readonly projectService: ProjectService
  ) {}

  async trackView(
    createTrackingDto: CreateTrackingDto
  ): Promise<CreateTrackingResponse> {
    const { slug, type, byDevice } = createTrackingDto;

    const device = this.analyzeDevice(byDevice);

    // First get the post information
    let post;
    if (type === 'blog') {
      post = await this.blogService.findBySlug(slug);
    } else if (type === 'project') {
      post = await this.projectService.findBySlug(slug);
    } else if (type === 'service') {
      post = await this.serviceService.findBySlug(slug);
    }

    if (!post) {
      throw new Error(`${type} with slug ${slug} not found`);
    }

    // First find the existing document
    const existingTracking = await this.trackingModel.findOne({ slug, type });

    if (!existingTracking) {
      // Create new tracking document
      const tracking = await this.trackingModel.create({
        slug,
        type,
        postId: post._id,
        title: post.title,
        views: 1,
        byDevice: {
          mobile: device === 'mobile' ? 1 : 0,
          desktop: device === 'desktop' ? 1 : 0,
          tablet: device === 'tablet' ? 1 : 0,
          other: device === 'other' ? 1 : 0,
        },
      });
      return {
        status: StatusType.Success,
        result: tracking,
      };
    }

    // Update existing document
    const tracking = await this.trackingModel.findOneAndUpdate(
      { slug, type },
      {
        $inc: {
          views: 1,
          [`byDevice.${device}`]: 1,
        },
        $set: {
          postId: post._id,
          title: post.title,
        },
      },
      { new: true }
    );

    if (!tracking) {
      throw new Error(
        `Failed to update tracking for ${type} with slug ${slug}`
      );
    }

    // Update the related service view count
    if (type === 'blog') {
      await this.blogService.updateView(slug, 1);
    } else if (type === 'project') {
      await this.projectService.updateView(slug, 1);
    } else if (type === 'service') {
      await this.serviceService.updateView(slug, 1);
    }

    // Clear cache for this tracking data
    const cacheKey = buildCacheKey('tracking', {
      slug,
      type,
    });
    await this.redisCacheService.del(cacheKey);
    await this.redisCacheService.reset();

    return {
      status: StatusType.Success,
      result: tracking,
    };
  }

  private analyzeDevice(userAgent: string): string {
    if (!userAgent) return 'other';

    if (userAgent.includes('Mobile')) {
      return 'mobile';
    } else if (userAgent.includes('Tablet')) {
      return 'tablet';
    } else if (userAgent.includes('Desktop')) {
      return 'desktop';
    }
    return 'other';
  }

  private async getTotalViews(
    type: 'blog' | 'project' | 'service',
    slug: string
  ): Promise<number> {
    const tracking = await this.trackingModel.find({ slug, type });
    return tracking.reduce((total, item) => total + item.views, 0);
  }

  private analyzeSource(referrer: string): string {
    if (!referrer) return 'direct';

    if (referrer.includes('facebook.com')) {
      return 'facebook';
    } else if (referrer.includes('google.com')) {
      return 'google';
    } else if (referrer.includes('tiktok.com')) {
      return 'tiktok';
    } else if (referrer.includes('instagram.com')) {
      return 'instagram';
    }

    return 'other';
  }

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    type?: Type,
    sort?: 'asc' | 'desc'
  ): Promise<Pagination<TrackingResponseDto>> {
    const cacheKey = buildCacheKey('tracking', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      type: type || 'all',
      sort: sort || 'desc',
    });
    const cached =
      await this.redisCacheService.get<Pagination<TrackingResponseDto>>(
        cacheKey
      );

    if (cached) {
      return cached;
    }

    const { filter, sortCondition } = buildTrackingFilter({
      startDate,
      endDate,
      type,
      sort,
    });

    const trackings = await this.trackingModel
      .find(filter)
      .lean()
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(sortCondition) // <--- phải là cái này
      .exec();

    // Tổng số kết quả
    const total = await this.trackingModel.countDocuments(filter);

    // Chuyển đổi dữ liệu theo định dạng DTO
    const results = trackings.map((tracking) => ({
      ...toDataResponse(tracking),
      byDevice: tracking.byDevice || {
        mobile: 0,
        desktop: 0,
        tablet: 0,
        other: 0,
      },
    }));

    // Tạo phân trang
    const result = new Pagination<TrackingResponseDto>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    // Lưu kết quả vào cache
    await this.redisCacheService
      .set(cacheKey, result, 604800)
      .catch(() => null);

    return result;
  }
}
