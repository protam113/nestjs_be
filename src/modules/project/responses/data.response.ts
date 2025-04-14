export interface DataResponse {
  status: string;
  result: {
    _id: string;
    title: string;
    slug: string;
    file: string;
    content: string;
    description: string;
    link?: string;
    brand_name: string;
    testimonial: string;
    client: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
