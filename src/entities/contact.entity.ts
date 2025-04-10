import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Base } from './base.entity';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class ContactEntity extends Base {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: String, required: false })
  phone_number: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, required: false })
  link: string;

  @Prop({ type: [String], required: false })
  services: string[];

  @Prop({ type: String, default: 'pending' })
  status: string;
}

export type ContactDocument = ContactEntity & Document;
export const ContactSchema = SchemaFactory.createForClass(ContactEntity);
