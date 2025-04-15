import { ContactDocument } from 'src/entities/contact.entity';

export interface UpdateContactResponse {
  status: string;
  result: ContactDocument;
}
