// entities/system-log.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from './base.entity';

export enum SystemLogType {
  UserStatistic = 'USER_STATISTIC',
  CreateManager = 'CREATE_MANAGER',
  FaqCreated = 'FAQ_CREATED',
  CategoryCreated = 'CATEGORY_CREATED',
  BlogCreated = 'BLOG_CREATED',
  ServiceCreated = 'SERVICE_CREATED',
  ServiceDeleted = 'SERVICE_DELETED',

  BlogUpdated = 'BLOG_UPDATED',
  BlogDeleted = 'BLOG_DELETED',
  CategoryUpdated = 'CATEGORY_UPDATED',
  DeletedUser = 'DELETED_USER',

  FaqUpdated = 'FAQ_UPDATED',
  FaqDeleted = 'FAQ_DELETED',
  // thêm mấy cái khác nếu cần
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
  @Prop({ enum: SystemLogType, required: true })
  type: SystemLogType;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Object }) // lưu json
  data: Record<string, unknown>;

  loggedAt: Date; // auto gán từ timestamps
}

export const SystemLogSchema = SchemaFactory.createForClass(SystemLog);
