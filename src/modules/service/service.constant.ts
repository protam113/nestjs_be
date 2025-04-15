export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  PRICE_VALIDATION = 'PRICE_VALIDATION',
  FILE_REQUIRED = 'FILE_REQUIRED',
  SERVICE_ALREADY_EXIT = 'SERVICE_ARRAY_EXIT',
  NOT_FOUND = 'NOT_FOUND',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  INVALID_STATUS = 'INVALID_STATUS',
}

export enum Success {
  Created = 'Service created successfully',
  Updated = 'Service updated successfully',
  Deleted = 'Service deleted successfully',
}

export enum Message {
  ServiceNotFound = 'Service not found',
  ThisServiceAlreadyExists = 'This service already exists',
  ServiceCreatedSuccessfully = 'Service created successfully',
  ServiceUpdatedSuccessfully = 'Service updated successfully',
  ServiceDeletedSuccessfully = 'Service deleted successfully',
  ValidPrice = 'Price must be a valid number',
  FileRequired = 'File is required',
  FailedUploadImage = 'File upload failed',
  InvalidStatus = 'Invalid status value',
}

export enum Service {
  Success = 'SUCCESS',
}

export enum ServiceStatus {
  Show = 'show',
  Hide = 'hide',
  Popular = 'popular',
  Draft = 'draft',
}
