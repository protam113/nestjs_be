import { Status, SystemLogType } from '../../entities/system-log.entity';

export interface CreateSystemLogDTO {
  type: SystemLogType;
  note: string;
  status: Status;
  data?: any;
}

export interface SystemLogResponse {
  _id: string;
  message: string;
  status: string;
  type: SystemLogType;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    _id: string;
    username: string;
    name: string;
    role: string;
  };
  note: string;
  data: any;
}
