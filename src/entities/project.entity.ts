import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { COLLECTION_KEYS } from 'src/database/collections';
import { ServiceEntity } from './service.entity';

export enum Status {
  Show = 'show',
  Hide = 'hide',
  Draft = 'draft',
  Popular = 'popular',
}

@Schema()
export class ProjectEntity extends Base {
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
  file: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  brand_name: string;

  @Prop({ required: true })
  testimonial: string;

  @Prop({ type: [String], ref: ServiceEntity.name })
  service: string[];

  @Prop({ required: true })
  client: string;

  @Prop()
  link?: string;

  @Prop({ enum: Status, default: Status.Draft })
  status: string;

  @Prop({ type: Object })
  user: any;
}
export type ProjectDocument = ProjectEntity & Document;
export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);
ProjectSchema.set('collection', COLLECTION_KEYS.PROJECT);
