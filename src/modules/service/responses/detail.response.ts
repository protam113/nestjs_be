interface User {
  _id: string;
  name: string;
}

export interface DetailResponse {
  status: string;
  result: {
    _id: string;
    title: string;
    slug: string;
    file: string;
    content: string;
    description: string;
    user: User;
    views: number;
    link?: string;
    price?: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
