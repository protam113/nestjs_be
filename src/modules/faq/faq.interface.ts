import { Document } from 'mongoose';

export interface FaqDocument extends Document {
  question: string;
  answer: string;
  user: any;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export class CreateFaqDto {
  question: string;
  answer: string;
  status?: string;
}

export class UpdateFaqDto {
  question?: string;
  answer?: string;
  status?: string;
}

export interface FaqFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}
