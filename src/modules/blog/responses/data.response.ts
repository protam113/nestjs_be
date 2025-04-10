export interface DataResponse {
  status: string;
  result: {
    _id: string;
    title: string;
    slug: string;
    content: string;
    description: string;
    link?: string;
    category?: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
