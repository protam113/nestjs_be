export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisServiceAlreadyExists = 'This service already exists',
  ServiceNotFound = 'Service not found',
}

export enum Success {
  Created = 'Service created successfully',
  Updated = 'Service updated successfully',
  Deleted = 'Service deleted successfully',
}

export enum ServiceStatus {
  Show = 'show',
  Hide = 'hide',
  Popular = 'popular',
  Draft = 'draft',
}
