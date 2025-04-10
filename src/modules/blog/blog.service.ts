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
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogDocument, BlogEntity } from 'src/entities/blog.entity';
import { DataResponse } from './responses/data.response';
import { CategoryService } from '../category/category.service';
import { Error } from './blog.constant';
import { BlogStatus } from './blog.constant';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(BlogEntity.name)
    private readonly blogModel: Model<BlogDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly categoryService: CategoryService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: BlogStatus,
    category?: string
  ): Promise<Pagination<DataResponse>> {
    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && Object.values(BlogStatus).includes(status)) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    const blogs = await this.blogModel
      .find(filter)
      .populate('category', 'name')
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.blogModel.countDocuments(filter);

    const mappedBlogs = blogs.map(this.mapToDataResponse);

    const totalPages = Math.ceil(total / options.limit);

    return new Pagination<DataResponse>({
      results: mappedBlogs,
      total,
      total_page: totalPages,
      page_size: options.limit,
      current_page: options.page,
    });
  }

  async create(
    createBlogDto: CreateBlogDto,
    user: UserData
  ): Promise<BlogDocument> {
    const { title, content, description, category } = createBlogDto;

    // Generate slug from title
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    // Check if blog with same title/slug exists
    const existingBlog = await this.blogModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existingBlog) {
      throw new BadRequestException(Error.ThisBlogAlreadyExists);
    }

    // Validate categories if provided
    if (category) {
      const validCategories =
        await this.categoryService.validateCategories(category);
      if (!validCategories) {
        throw new BadRequestException('Invalid category IDs provided');
      }
    }

    const newBlog = new this.blogModel({
      title,
      slug,
      content,
      description,
      category,
      status: BlogStatus.Show, // Default status
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    return await newBlog.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.blogModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Blog not found');
    }
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const blog = await this.blogModel
      .findOne({ slug })
      .populate('category', 'name')
      .lean();

    if (!blog) {
      throw new NotFoundException(Error.BlogNotFound);
    }

    return this.mapToDataResponse(blog);
  }

  private mapToDataResponse(blog: any): DataResponse {
    return {
      status: 'success',
      result: {
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        description: blog.description,
        link: blog.link,
        category: blog.category,
        status: blog.status,
        createdAt: blog.createdAt || new Date(),
        updatedAt: blog.updatedAt || new Date(),
      },
    };
  }
}
