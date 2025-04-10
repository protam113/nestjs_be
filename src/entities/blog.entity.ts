import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

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
  description: string;

  @Prop()
  link?: string;

  @Prop({
    type: String,
    enum: ['normal', 'popular'],
    default: 'normal',
  })
  type: 'normal' | 'popular';

  @Prop([
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
    },
  ])
  category: Array<{
    _id: string;
    name: string;
  }>;

  @Prop({
    type: {
      _id: { type: String, required: true },
      username: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    required: true,
  })
  user: {
    _id: string;
    username: string;
    name: string;
    role: string;
  };
}

export const BlogSchema = SchemaFactory.createForClass(BlogEntity);
