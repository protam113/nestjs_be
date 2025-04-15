import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserData } from '../user/user.interface';
import { DataResponse } from './responses/data.response';
import { FaqEntity, FaqDocument } from '../../entities/faq.entity';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { Error, MAX_MAIN_FAQS, Message, Status } from './faq.constant';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { UpdateFaqDto } from './dto/update_faq.dto';
import { CreateFaqDto } from './dto/create_faq.dto';
import { CreateFaqResponse } from './responses/create_faq.response';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  constructor(
    @InjectModel(FaqEntity.name)
    private readonly faqModel: Model<FaqDocument>,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async created(
    createFaqDto: CreateFaqDto,
    user: UserData
  ): Promise<CreateFaqResponse> {
    if (!createFaqDto || !createFaqDto.question || !createFaqDto.answer) {
      throw new BadRequestException(Error.QuestionRequired);
    }

    // Check main FAQ limit if status is 'main'
    if (createFaqDto.status === Status.Main) {
      const mainFaqCount = await this.faqModel.countDocuments({
        status: Status.Main,
      });
      if (mainFaqCount >= MAX_MAIN_FAQS) {
        throw new BadRequestException(
          'Maximum number of main FAQs (4) has been reached'
        );
      }
    }

    const normalizedQuestion = createFaqDto.question.trim();
    createFaqDto.question = normalizedQuestion;

    const existing = await this.faqModel.findOne({
      question: normalizedQuestion,
    });

    if (existing) {
      throw new BadRequestException(Error.QuestionAlreadyExit);
    }

    const newFaq = new this.faqModel({
      ...createFaqDto,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await newFaq.save();
      await this.redisCacheService.reset();

      return {
        status: StatusType.Success,
        result: newFaq,
      };
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException(Error.QuestionAlreadyExit);
      }
      throw err; // Nếu lỗi khác, ném lại
    }
  }

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: Status
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('faq', {
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
    // Changed return type temporarily
    const filter: any = {};

    // Lọc theo khoảng thời gian tạo
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && Object.values(Status).includes(status))
      filter.status = status;

    const faqs = await this.faqModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const total = await this.faqModel.countDocuments(filter);

    const mappedFaqs = faqs.map((faq) => ({
      _id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.createdAt || new Date(),
      updatedAt: faq.updatedAt || new Date(),
      status: faq.status,
      user: {
        _id: faq.user?._id?.toString(),
        username: faq.user?.username,
        name: faq.user?.name,
        role: faq.user?.role,
      },
    })) as DataResponse[];

    const result = new Pagination<DataResponse>({
      results: mappedFaqs,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService
      .set(cacheKey, result, 604800)
      .catch(() => null);
    return result;
  }

  async findOne(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel.findById(id).lean().exec();
    if (!faq) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FaqNotFound,
        error: Error.NotFound,
      });
    }
    return faq;
  }

  async update(
    id: string,
    updateFaqDto: UpdateFaqDto,
    user: UserData
  ): Promise<FaqDocument> {
    const faq = await this.faqModel.findById(id);
    if (!faq) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FaqNotFound,
        error: Error.NotFound,
      });
    }

    // Include user information in the update
    const updateData = {
      ...updateFaqDto,
      updatedAt: new Date(),
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    };

    const updatedFaq = await this.faqModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .lean()
      .exec();

    return updatedFaq as FaqDocument;
  }

  async delete(id: string): Promise<void> {
    const result = await this.faqModel.findByIdAndDelete(id);
    await this.redisCacheService.reset();

    if (!result) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FaqNotFound,
        error: Error.NotFound,
      });
    }
  }
}
