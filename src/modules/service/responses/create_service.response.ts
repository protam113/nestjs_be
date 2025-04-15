import { ServiceDocument } from 'src/entities/service.entity';

export interface CreateServiceResponse {
  status: string;
  result: ServiceDocument;
}
