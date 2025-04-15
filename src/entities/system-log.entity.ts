// entities/system-log.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { COLLECTION_KEYS } from 'src/database/collections';

export enum SystemLogType {
  UserStatistic = 'USER_STATISTIC',
  CreateManager = 'CREATE_MANAGER',
  DeletedUser = 'DELETED_USER',
  UpdateStatus = 'UPDATE_STATUS',
  SentMail = 'SENT_MAIL',

  // Contact
  DeletedContact = 'DELETED_CONTACT',

  // Faq
  FaqCreated = 'FAQ_CREATED',
  FaqUpdated = 'FAQ_UPDATED',
  FaqDeleted = 'FAQ_DELETED',

  // Pricing
  PricingDeleted = 'PRICING_DELETED',
  PricingUpdated = 'PRICING_UPDATED',
  PricingCreated = 'PRICING_CREATED',

  // Blog
  BlogCreated = 'BLOG_CREATED',
  BlogUpdated = 'BLOG_UPDATED',
  BlogDeleted = 'BLOG_DELETED',

  // Category
  CategoryCreated = 'CATEGORY_CREATED',
  CategoryUpdated = 'CATEGORY_UPDATED',

  // Service
  ServiceCreated = 'SERVICE_CREATED',
  ServiceDeleted = 'SERVICE_DELETED',

  // Project
  ProjectCreated = 'PROJECT_CREATED',
  ProjectUpdated = 'PROJECT_UPDATED',
  ProjectDeleted = 'PROJECT_DELETED',

  // Seo
  SeoUpdated = 'SEO_UPDATED',
}

export enum Status {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Success = 'SUCCESS',
}

@Schema() // tương đương CreateDateColumn
export class SystemLog extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ enum: SystemLogType, required: true })
  type: SystemLogType;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Object }) // lưu json
  data: Record<string, unknown>;

  loggedAt: Date; // auto gán từ timestamps
}

export const SystemLogSchema = SchemaFactory.createForClass(SystemLog);
SystemLogSchema.set('collection', COLLECTION_KEYS.SYSTEMLOGS);
