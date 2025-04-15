import { FaqDocument } from 'src/entities/faq.entity';

export interface CreateFaqResponse {
  status: string;
  result: FaqDocument;
}
