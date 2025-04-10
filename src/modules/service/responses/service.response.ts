export interface DataResponse {
  status: string;
  result: {
    _id: string;
    title: string;
    slug: string;
    content: string;
    description: string;
    link?: string;
    price?: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
