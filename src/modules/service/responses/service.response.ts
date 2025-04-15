export interface DataResponse {
  _id: string;
  title: string;
  slug: string;
  file: string;
  content: string;
  description: string;
  link?: string;
  price?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
