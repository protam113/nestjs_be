interface Category {
  _id: string;
  name: string;
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
  link?: string;
  user: User;
  views: number;
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
    views: number;
    user: User;
    link?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
