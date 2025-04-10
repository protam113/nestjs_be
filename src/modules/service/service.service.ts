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
import { CreateServiceDto } from './dto/create-service';
import { DataResponse } from './responses/service.response';
import { Error, ServiceStatus } from './service.constant';
import { ServiceDocument, ServiceEntity } from 'src/entities/service.entity';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @InjectModel(ServiceEntity.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly slugProvider: SlugProvider
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: ServiceStatus
  ): Promise<Pagination<DataResponse>> {
    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && Object.values(ServiceStatus).includes(status)) {
      filter.status = status;
    }

    const services = await this.serviceModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.serviceModel.countDocuments(filter);

    const mapped = services.map(this.mapToDataResponse);

    const totalPages = Math.ceil(total / options.limit);

    return new Pagination<DataResponse>({
      results: mapped,
      total,
      total_page: totalPages,
      page_size: options.limit,
      current_page: options.page,
    });
  }

  async create(
    createServiceDto: CreateServiceDto,
    user: UserData
  ): Promise<ServiceDocument> {
    const { title, content, description, price, link } = createServiceDto;

    // Generate slug from title
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existing = await this.serviceModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existing) {
      throw new BadRequestException(Error.ThisServiceAlreadyExists);
    }

    const newService = new this.serviceModel({
      title,
      slug,
      content,
      description,
      price: price || undefined,
      link: link || undefined,
      status: ServiceStatus.Show,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    return await newService.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(Error.ServiceNotFound);
    }
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const service = await this.serviceModel.findOne({ slug }).lean();

    if (!service) {
      throw new NotFoundException(Error.ServiceNotFound);
    }

    return this.mapToDataResponse(service);
  }

  private mapToDataResponse(service: any): DataResponse {
    return {
      status: 'success',
      result: {
        _id: service._id,
        title: service.title,
        slug: service.slug,
        content: service.content,
        description: service.description,
        link: service.link,
        price: service.price,
        status: service.status,
        createdAt: service.createdAt || new Date(),
        updatedAt: service.updatedAt || new Date(),
      },
    };
  }
}
