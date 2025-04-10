import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ServiceEntity extends Base {
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

  @Prop()
  price?: number;

  @Prop({ default: 'show' })
  status: string;

  @Prop({ type: Object })
  user: any;
}
export type ServiceDocument = ServiceEntity & Document;
export const ServiceSchema = SchemaFactory.createForClass(ServiceEntity);
