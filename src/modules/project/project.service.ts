import { SlugProvider } from '../slug/slug.provider';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { UserData } from '../user/user.interface';
import { CreateProjectDto } from './dto/create_project.dto';
import { DataResponse } from './responses/data.response';
import { Error, ProjectStatus } from './project.constant';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { ProjectDocument, ProjectEntity } from 'src/entities/project.entity';
import { MediaService } from '../media/media.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(ProjectEntity.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService,
    private readonly mediaService: MediaService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: ProjectStatus
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('projects', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
    });
    const cached =
      await this.redisCacheService.get<Pagination<DataResponse>>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && Object.values(ProjectStatus).includes(status)) {
      filter.status = status;
    }

    const services = await this.projectModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.projectModel.countDocuments(filter);

    const results = services.map(this.mapToDataResponse);

    const result = new Pagination<DataResponse>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async delete(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id);
    await this.redisCacheService.reset();
    if (!result) {
      throw new NotFoundException(Error.NotFound);
    }
  }

  async create(
    createProjectDto: CreateProjectDto,
    user: UserData,
    file?: Express.Multer.File
  ): Promise<ProjectDocument> {
    const {
      title,
      content,
      description,
      link,
      brand_name,
      testimonial,
      client,
    } = createProjectDto;

    // Generate slug from title
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existing = await this.projectModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existing) {
      throw new BadRequestException(Error.ThisProjectAlreadyExists);
    }

    let imageUrl = '';
    if (!file) {
      throw new BadRequestException('File is required'); // Nếu file bắt buộc
    }

    const folderPath = '/projects';
    try {
      const uploadedImage = await this.mediaService.uploadFile(
        folderPath,
        file
      );
      imageUrl = uploadedImage.url;
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw new BadRequestException('File upload failed');
    }

    const newProject = new this.projectModel({
      title,
      slug,
      content,
      description,
      brand_name,
      file: imageUrl || '',
      testimonial,
      client,
      link: link || undefined,
      status: ProjectStatus.Draft,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });
    await this.redisCacheService.reset();

    return await newProject.save();
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const cacheKey = `project_${slug}`;
    const cached = await this.redisCacheService.get<DataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }
    const service = await this.projectModel.findOne({ slug }).lean();

    if (!service) {
      throw new NotFoundException(Error.NotFound);
    }
    const result = this.mapToDataResponse(service);

    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return result;
  }

  async validateProject(serviceId: string): Promise<boolean> {
    try {
      const service = await this.projectModel.findById(serviceId).exec();
      return !!service; // Returns true if service exists, false otherwise
    } catch (error) {
      this.logger.error(`Error validating service: ${error.message}`);
      return false;
    }
  }

  async updateStatus(
    id: string,
    status: ProjectStatus
  ): Promise<ProjectDocument> {
    // Kiểm tra tính hợp lệ của status
    if (!Object.values(ProjectStatus).includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const project = await this.projectModel.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Trả về document sau khi cập nhật
    );

    if (!project) {
      throw new NotFoundException(Error.NotFound);
    }

    await this.redisCacheService
      .reset()
      .catch((err) => this.logger.error('Failed to clear cache:', err));

    return project;
  }

  private mapToDataResponse(project: any): DataResponse {
    return {
      status: 'success',
      result: {
        _id: project._id,
        title: project.title,
        slug: project.slug,
        file: project.file,
        content: project.content,
        description: project.description,
        link: project.link,
        brand_name: project.brand_name,
        client: project.client,
        testimonial: project.testimonial,
        status: project.status,
        createdAt: project.createdAt || new Date(),
        updatedAt: project.updatedAt || new Date(),
      },
    };
  }
}
