import { FaqStatus } from './faq.constant';

export interface FaqFilterQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: FaqStatus;
}
