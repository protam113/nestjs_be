import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactDocument } from './contact.interface';
import { ContactEntity } from '../../entities/contact.entity';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { Error } from './contact.constant';
import { EmailService } from 'src/services/email.service';
import { DataResponse } from './responses/data.response';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UserData } from '../user/user.interface';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactEntity.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly emailService: EmailService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string
  ): Promise<Pagination<DataResponse>> {
    // Changed return type to match DataResponse
    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (filter.status) {
      filter.status = filter.status;
    }

    const contacts = await this.contactModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.contactModel.countDocuments(filter);

    const mappedContact = contacts.map((contact) => ({
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number,
      link: contact.link,
      services: contact.services,
      status: contact.status,
      createdAt: contact.createdAt || new Date(),
      updatedAt: contact.updatedAt || new Date(),
    })) as DataResponse[];

    return new Pagination<DataResponse>({
      results: mappedContact,
      total,
    });
  }

  async findOne(_id: string): Promise<ContactDocument> {
    const faq = await this.contactModel.findById(_id).lean().exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async delete(_id: string): Promise<void> {
    const result = await this.contactModel.findByIdAndDelete(_id);
    if (!result) {
      throw new NotFoundException(Error.NotFound);
    }
  }

  async created(createContactDto: CreateContactDto): Promise<ContactDocument> {
    if (
      !createContactDto ||
      !createContactDto.name ||
      !createContactDto.email ||
      !createContactDto.message
    ) {
      throw new BadRequestException('Name, email and message are required');
    }

    const newContact = new this.contactModel({
      ...createContactDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedContact = await newContact.save();

    // ✅ Gửi email cảm ơn qua EmailService
    try {
      await this.emailService.sendThankYouEmail({
        recipientEmail: createContactDto.email,
        name: createContactDto.name,
      });
      this.logger.log(
        `Thank you email has been sent ${createContactDto.email}`
      );
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
    }

    return savedContact;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    user: UserData
  ): Promise<ContactDocument> {
    const contact = await this.contactModel.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const updatedContact = await this.contactModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateContactDto,
            updatedAt: new Date(),
            user: {
              userId: user._id,
              username: user.username,
              role: user.role,
            },
          },
        },
        { new: true }
      )
      .exec();

    if (!updatedContact) {
      throw new NotFoundException(Error.NotFound);
    }

    return updatedContact;
  }
}
