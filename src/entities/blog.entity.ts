import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { CategoryEntity } from './category.entity';
import { COLLECTION_KEYS } from 'src/database/collections';
import { BlogStatus } from 'src/modules/blog/blog.constant';

@Schema()
export class BlogEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({
    unique: true,
    required: true,
  })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  file: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  link?: string;

  @Prop({ enum: BlogStatus, default: BlogStatus.Draft })
  status: string;

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: Object })
  user: any;

  @Prop({ type: String, ref: CategoryEntity.name })
  category: CategoryEntity;
}
export type BlogDocument = BlogEntity & Document;
export const BlogSchema = SchemaFactory.createForClass(BlogEntity);
BlogSchema.set('collection', COLLECTION_KEYS.BLOG);
