import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class CategoryEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    unique: true,
    required: true,
  })
  slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryEntity);
