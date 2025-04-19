export interface DetailResponse {
  status: string;
  result: {
    _id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
