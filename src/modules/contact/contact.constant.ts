export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum Error {
  ChangedStatus = 'Error changing status',
  NotFound = 'Not found',
  DataRequired = 'Name, email and message are required',
  ServiceNotFound = 'Service not found',
  ServiceValidation = 'Service validation failed',
}

export enum Success {
  Created = 'Contact sent successfully',
  Updated = 'Contact updated successfully',
  Deleted = 'Contact deleted successfully',
}

export enum ContactStatus {
  Approved = 'approved',
  Pending = 'pending',
  Rejected = 'rejected',
}
