import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Base } from './base.entity';
import { COLLECTION_KEYS } from 'src/database/collections';
import { FaqStatus } from 'src/modules/faq/faq.constant';

@Schema()
export class FaqEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true, unique: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: Object })
  user: any;

  @Prop({ enum: FaqStatus, default: FaqStatus.Show })
  status: string;
}

export type FaqDocument = FaqEntity & Document;
export const FaqSchema = SchemaFactory.createForClass(FaqEntity);
FaqSchema.set('collection', COLLECTION_KEYS.FAQ);
