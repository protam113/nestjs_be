export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum Error {
  CONTACT_NOT_FOUND = 'CONTACT_NOT_FOUND',
}

export enum Success {
  Created = 'Contact sent successfully',
  Updated = 'Contact updated successfully',
  Deleted = 'Contact deleted successfully',
}

export enum Message {
  ContactNotFound = 'Contact not found',
  Service = 'service',
  ChangedStatus = 'Error changing status',
  NotFound = 'Not found',
  DataRequired = 'Name, email and message are required',
  ServiceNotFound = 'Service not found',
  ServiceValidation = 'Service validation failed',
}

export enum ContactStatus {
  Approved = 'approved',
  Pending = 'pending',
  Rejected = 'rejected',
}

export const CONTACT_CACHE_TTL = {
  CONTACT_LIST: 3600,
  CONTACT_DETAIL: 10800,
};
