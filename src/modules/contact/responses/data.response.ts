interface Service {
  _id: string;
  title: string;
}

export interface DataResponse {
  _id: string;
  email: string;
  phone_number: string;
  name: string;
  link?: string;
  status: string;
  message: string;
  service?: Service;
  createdAt: Date;
  updatedAt: Date;
}
