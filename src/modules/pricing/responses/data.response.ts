export interface DataResponse {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  subData?: string[];
}
