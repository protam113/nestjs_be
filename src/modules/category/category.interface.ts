import { Document } from 'mongoose';

export interface CategoryDocument extends Document {
  _id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
