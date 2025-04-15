import { ContactStatus } from '../contact.constant';

export interface DataResponse {
  _id: string;
  name: string;
  email: string;
  phone_number: string;
  message: string;
  link?: string;
  service?: {
    _id: string;
    name: string;
  };
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}
