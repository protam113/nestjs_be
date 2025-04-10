export interface DataResponse {
  _id: string;
  email: string;
  phone_number: string;
  name: string;
  link?: string;
  status: string;
  message: string;

  createdAt: Date;
  updatedAt: Date;
  services?: string[];
}
