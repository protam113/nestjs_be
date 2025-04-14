import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Base } from './base.entity';
import { COLLECTION_KEYS } from 'src/database/collections';
import { PricingStatus } from 'src/modules/pricing/pricing,constant';

@Schema()
export class PricingEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: Object })
  subData: any;

  @Prop({ type: Object })
  user: any;

  @Prop({ enum: PricingStatus, default: PricingStatus.Show })
  status: string;
}

export type PricingDocument = PricingEntity & Document;
export const PricingSchema = SchemaFactory.createForClass(PricingEntity);
PricingSchema.set('collection', COLLECTION_KEYS.PRICING);
