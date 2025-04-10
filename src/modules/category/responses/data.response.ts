import { Document } from 'mongoose';

export interface DataResponse {
  status: string;
  result: {
    _id: string;
    name: string;
    slug: string;
  };
}

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  user: any;
  createdAt: Date;
  updatedAt: Date;
}
