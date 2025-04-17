import { FaqStatus } from '../faq.constant';

export class CreateFaqDto {
  question: string;
  answer: string;
  status?: FaqStatus;
}
