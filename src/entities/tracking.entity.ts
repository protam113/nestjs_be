import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Base } from './base.entity';
import { COLLECTION_KEYS } from 'src/database/collections';

@Schema()
export class TrackingEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ index: true, required: true })
  slug: string;

  @Prop({ required: true, enum: ['blog', 'project', 'service'], index: true })
  type: 'blog' | 'project' | 'service';

  @Prop({ default: 0 })
  views: number;

  @Prop({
    type: Object,
    default: {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    },
  })
  byDevice: Record<string, number>;
}

export type TrackingDocument = TrackingEntity & Document;
export const TrackingSchema = SchemaFactory.createForClass(TrackingEntity);
TrackingSchema.set('collection', COLLECTION_KEYS.TRACKING);
