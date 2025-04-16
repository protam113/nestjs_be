export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisProjectAlreadyExists = 'This project already exists',
  NOT_FOUND = 'NOT_FOUND',
  PROJECT_ALREADY_EXISTS = 'PROJECT_ALREADY_EXISTS',
  FILE_REQUIRED = 'FILE_REQUIRED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  SERVICE_REQUIRED = 'SERVICE_REQUIRED',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
}

export enum Success {
  Created = 'Project created successfully',
  Updated = 'Project updated successfully',
  Deleted = 'Project deleted successfully',
}

export enum Message {
  ThisProjectAlreadyExists = 'This project already exists',
  NotFound = 'Project not found',
  FileRequired = 'File is required',
  FileUploadFailed = 'File upload failed',
  SERVICE_REQUIRED = 'Service is required',
  ServiceNotFound = 'Service not found',
  ServiceValidationFailed = 'Service validation failed',
  InvalidViewsCount = 'Invalid views count',
}

export enum ProjectStatus {
  Show = 'show',
  Hide = 'hide',
  Popular = 'popular',
  Draft = 'draft',
}
