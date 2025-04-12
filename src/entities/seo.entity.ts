import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { COLLECTION_KEYS } from 'src/database/collections';

@Schema()
export class SeoEntity {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  site_title: string;

  @Prop()
  site_description: string;

  @Prop({ required: true })
  domain: string;

  @Prop({
    type: [{ type: String }],
    default: [],
    validate: [(val: string[]) => val.length <= 50, 'Too many keywords'],
  })
  keywords: string[];

  @Prop() google_analytics_id?: string;
  @Prop() gtm_id?: string;
  @Prop() facebook_pixel_id?: string;
  @Prop() search_console_verification?: string;
}

export type SeoDocument = SeoEntity & Document;
export const SeoSchema = SchemaFactory.createForClass(SeoEntity);
SeoSchema.set('collection', COLLECTION_KEYS.SEO);
