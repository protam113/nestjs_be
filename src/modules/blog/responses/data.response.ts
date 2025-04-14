interface Category {
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
  link?: string;
  category: Category;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DetailResponse {
  status: string;
  data: {
    _id: string;
    title: string;
    slug: string;
    file: string;
    content: string;
    description: string;
    category: Category;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
