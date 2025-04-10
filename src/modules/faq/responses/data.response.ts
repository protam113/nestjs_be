export interface DataResponse {
  _id: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'show' | 'hide';
  user: {
    _id: string;
    username: string;
    name: string;
    role: string;
  };
}
