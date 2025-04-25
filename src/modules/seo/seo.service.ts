import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SeoEntity, SeoDocument } from '../../entities/seo.entity';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    @InjectModel(SeoEntity.name)
    private readonly seoModel: Model<SeoDocument>,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async getSeoData(): Promise<SeoDocument> {
    // Try to get from cache first
    const cacheKey = buildCacheKey('seo', { type: 'data' });
    const cachedData = await this.redisCacheService.get<SeoDocument>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    // If not in cache, get from database
    const seoData = await this.seoModel.findOne().lean();
    if (!seoData) {
      throw new NotFoundException('SEO data not found');
    }

    // Cache the data with maximum duration (30 days)
    await this.redisCacheService.set(cacheKey, seoData, 2592000);

    return seoData;
  }

  async updateSeoData(updateSeoDto: UpdateSeoDto): Promise<SeoDocument> {
    const seoData = await this.seoModel.findOne();

    if (!seoData) {
      throw new NotFoundException('SEO data not found');
    }

    const updatedData = {
      ...seoData.toObject(),
      ...Object.entries(updateSeoDto).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    };

    const updated = await this.seoModel.findOneAndUpdate(
      { _id: seoData._id },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundException('Failed to update SEO data');
    }
    try {
      await this.redisCacheService.delByPattern('seo*');
      this.logger.log('Cleared blog-related cache entries after create');
    } catch (error) {
      this.logger.error('Failed to clear cache after blog creation', error);
    }
    return updated;
  }

  // Initialize default SEO data if none exists
  async initializeDefaultSeo(): Promise<void> {
    const existingSeo = await this.seoModel.findOne();

    if (!existingSeo) {
      const defaultSeo = new this.seoModel({
        site_title: 'Hust4L®',
        site_description: 'Welcome to UGC Creator...',
        domain: 'hust4l.com',
        keywords: ['digital marketing', 'performance marketing', 'SEO'],
        google_analytics_id: '12392392139219',
        gtm_id: '12392392139219',
        facebook_pixel_id: '12392392139219',
        search_console_verification: '12392392139219',
      });

      await defaultSeo.save();
    }
  }
}
