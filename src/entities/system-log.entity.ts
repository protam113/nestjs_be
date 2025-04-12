// entities/system-log.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { COLLECTION_KEYS } from 'src/database/collections';

export enum SystemLogType {
  UserStatistic = 'USER_STATISTIC',
  CreateManager = 'CREATE_MANAGER',
  FaqCreated = 'FAQ_CREATED',
  CategoryCreated = 'CATEGORY_CREATED',
  BlogCreated = 'BLOG_CREATED',
  ServiceCreated = 'SERVICE_CREATED',
  ServiceDeleted = 'SERVICE_DELETED',
  PricingCreated = 'PRICING_CREATED',
  BlogUpdated = 'BLOG_UPDATED',
  BlogDeleted = 'BLOG_DELETED',
  CategoryUpdated = 'CATEGORY_UPDATED',
  DeletedUser = 'DELETED_USER',
  DeletedContact = 'DELETED_CONTACT',
  PricingDeleted = 'PRICING_DELETED',
  PricingUpdated = 'PRICING_UPDATED',
  FaqUpdated = 'FAQ_UPDATED',
  FaqDeleted = 'FAQ_DELETED',
  UpdateStatus = 'UPDATE_STATUS',
  SentMail = 'SENT_MAIL',
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
