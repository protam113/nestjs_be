import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FaqDocument, CreateFaqDto, UpdateFaqDto } from './faq.interface';
import { UserData } from '../user/user.interface';
import { DataResponse } from './responses/data.response';
import { FaqEntity } from '../../entities/faq.entity';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { Error } from './faq.constant';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  constructor(
    @InjectModel(FaqEntity.name)
    private readonly faqModel: Model<FaqDocument>
  ) {}

  async created(
    createFaqDto: CreateFaqDto,
    user: UserData
  ): Promise<FaqDocument> {
    if (!createFaqDto || !createFaqDto.question || !createFaqDto.answer) {
      throw new BadRequestException('Question and answer are required');
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
      return await newFaq.save();
    } catch (err) {
      // ✅ Nếu đã set unique index ở MongoDB, có thể dính lỗi trùng tại đây
      if (err.code === 11000) {
        throw new BadRequestException(Error.QuestionAlreadyExit);
      }
      throw err; // Nếu lỗi khác, ném lại
    }
  }

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string
  ): Promise<Pagination<DataResponse>> {
    // Changed return type temporarily
    const filter: any = {};

    // Lọc theo khoảng thời gian tạo
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Lọc theo status nếu có
    if (filter.status) {
      filter.status = filter.status;
    }

    const faqs = await this.faqModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const total = await this.faqModel.countDocuments(filter);

    const mappedFaqs = faqs.map((faq) => ({
      _id: faq._id.toString(), // Convert to string
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.createdAt || new Date(),
      updatedAt: faq.updatedAt || new Date(),
      status: faq.status,
      user: {
        _id: faq.user?._id?.toString(), // Convert to string and handle potential null/undefined
        username: faq.user?.username,
        name: faq.user?.name,
        role: faq.user?.role,
      },
    })) as DataResponse[]; // Cast to DataResponse array

    return new Pagination<DataResponse>({
      results: mappedFaqs,
      total,
    });
  }

  async findOne(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel.findById(id).lean().exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
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
      throw new NotFoundException('FAQ not found');
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
    if (!result) {
      throw new NotFoundException('FAQ not found');
    }
  }
}
