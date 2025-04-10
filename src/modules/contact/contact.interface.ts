import { Document } from 'mongoose';

export interface ContactDocument extends Document {
  _id: string;
  name: string;
  email: string;
  phone_number: string;
  message: string;
  link?: string;
  services?: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
