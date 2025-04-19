interface User {
  _id: string;
  name: string;
}

export interface DataResponse {
  _id: string;
  name: string;
  slug: string;
  user: User;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
