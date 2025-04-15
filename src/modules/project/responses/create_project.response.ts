import { ProjectDocument } from 'src/entities/project.entity';

export interface CreateProjectResponse {
  status: string;
  result: ProjectDocument;
}
