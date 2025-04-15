import { SlugProvider } from '../slug/slug.provider';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { UserData } from '../user/user.interface';
import { CreateProjectDto } from './dto/create_project.dto';
import { DataResponse } from './responses/data.response';
import { Error, Message, ProjectStatus } from './project.constant';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { ProjectDocument, ProjectEntity } from 'src/entities/project.entity';
import { MediaService } from '../media/media.service';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';
import { toDataResponse } from './project.mapper';
import { CreateProjectResponse } from './responses/create_project.response';
import { ServiceService } from '../service/service.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(ProjectEntity.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService,
    private readonly mediaService: MediaService,
    private readonly serviceService: ServiceService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: ProjectStatus,
    service?: string
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('projects', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
      service: service || 'all',
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

    if (status) {
      const statusArray = status.split(',');
      const validStatuses = statusArray.filter((s) =>
        Object.values(ProjectStatus).includes(s as ProjectStatus)
      );
      if (validStatuses.length > 0) {
        filter.status = { $in: validStatuses };
      }
    }

    if (service) {
      filter.service = service;
    }

    const projects = await this.projectModel
      .find(filter)
      .populate('service', '_id title')
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.projectModel.countDocuments(filter);

    const results = projects.map(toDataResponse);

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
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.NotFound,
        error: Error.NOT_FOUND,
      });
    }
  }

  async create(
    createProjectDto: CreateProjectDto,
    user: UserData,
    file?: Express.Multer.File
  ): Promise<CreateProjectResponse> {
    const {
      title,
      content,
      description,
      link,
      brand_name,
      testimonial,
      service,
      client,
    } = createProjectDto;

    if (!service) {
      throw new BadRequestException({
        message: Message.SERVICE_REQUIRED,
        code: Error.SERVICE_REQUIRED,
      });
    }

    // Generate slug from title
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existing = await this.projectModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existing) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ThisProjectAlreadyExists,
        error: Error.PROJECT_ALREADY_EXISTS,
      });
    }

    let serviceIds: string[] | undefined;

    if (service) {
      try {
        const isValid = await this.serviceService.validateServices(service);
        if (!isValid) {
          throw new BadRequestException({
            statusCode: StatusCode.BadRequest,
            message: Message.ServiceNotFound,
            error: Error.SERVICE_NOT_FOUND,
          });
        }

        serviceIds = service;
      } catch (error) {
        throw new BadRequestException(
          `${Message.ServiceValidationFailed}: ${error.message}`
        );
      }
    }

    let imageUrl = '';
    if (!file) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FileRequired,
        error: Error.FILE_REQUIRED,
      });
    }

    const folderPath = '/projects';
    try {
      const uploadedImage = await this.mediaService.uploadFile(
        folderPath,
        file
      );
      imageUrl = uploadedImage.url;
    } catch (error) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FileUploadFailed,
        error: Error.FILE_UPLOAD_FAILED,
      });
    }

    const newProject = new this.projectModel({
      title,
      slug,
      content,
      description,
      brand_name,
      file: imageUrl || '',
      service: serviceIds,
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

    await newProject.save();
    await this.redisCacheService.reset();

    return {
      status: StatusType.Success,
      result: newProject,
    };
  }

  async findBySlug(slug: string): Promise<CreateProjectResponse> {
    const cacheKey = `project_${slug}`;
    const cached =
      await this.redisCacheService.get<CreateProjectResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }
    const project = await this.projectModel
      .findOne({ slug })
      .populate('service', '_id title') // Populate service
      .exec();

    if (!project) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.NotFound,
        error: Error.NOT_FOUND,
      });
    }
    const result = toDataResponse(project);

    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return {
      status: StatusType.Success,
      result: project,
    };
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
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.NotFound,
        error: Error.NOT_FOUND,
      });
    }

    await this.redisCacheService
      .reset()
      .catch((err) => this.logger.error('Failed to clear cache:', err));

    return project;
  }
}
