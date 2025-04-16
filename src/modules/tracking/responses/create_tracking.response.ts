import { TrackingDocument } from '../../../entities/tracking.entity';

export interface CreateTrackingResponse {
  status: string;
  result: TrackingDocument;
}
