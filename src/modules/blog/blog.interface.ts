import { Document } from 'mongoose';

export interface ContactDocument extends Document {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  link?: string;
  category?: string[];
  status: 'show' | 'hide' | 'popular';
  createdAt: Date;
  updatedAt: Date;
}
