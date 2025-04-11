import { Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    userId: string;
    username: string;
    role: string;
  };
}
