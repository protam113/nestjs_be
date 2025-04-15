import { ContactDocument } from 'src/entities/contact.entity';

export interface CreateContactResponse {
  status: string;
  result: ContactDocument;
}
