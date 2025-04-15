import { BlogDocument } from 'src/entities/blog.entity';

export interface CreateBlogResponse {
  status: string;
  result: BlogDocument;
}
