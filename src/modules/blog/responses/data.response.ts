interface Category {
  _id: string;
  name: string;
}

export interface DataResponse {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  link?: string;
  category?: Category[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
