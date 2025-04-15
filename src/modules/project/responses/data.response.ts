interface Service {
  _id: string;
  title: string;
}

interface User {
  _id: string;
  name: string;
}

export interface DataResponse {
  _id: string;
  title: string;
  slug: string;
  file: string;
  content: string;
  description: string;
  service: Service[];
  link?: string;
  brand_name: string;
  testimonial: string;
  user: User;
  client: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
