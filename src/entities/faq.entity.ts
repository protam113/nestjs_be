import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FaqEntity {
  @Prop({ required: true, unique: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ type: Object })
  user: any;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: 'show' })
  status: string;
}

export type FaqDocument = FaqEntity & Document;
export const FaqSchema = SchemaFactory.createForClass(FaqEntity);
