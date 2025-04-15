export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisPricingAlreadyExists = 'This pricing already exists',
  BadRequest = 'Bad Request',
  MainAlreadyExists = 'MainAlreadyExists',
  LimitExceeded = 'LimitExceeded',
  NotFound = 'Not Found',
  Conflict = 'Conflict',
  InternalServer = 'Internal server error',
}

export enum Message {
  MaximumPricing = 'The system only allows creating a maximum of 5 pricing packages.',
  OneMainOnly = 'Only one pricing package with status "main" is allowed.',
  PricingNotFound = 'Pricing not found',
  TitleRequired = 'Title is required !',
}

export enum Success {
  Created = 'Pricing created successfully',
  Updated = 'Pricing updated successfully',
  Deleted = 'Pricing deleted successfully',
}

export enum PricingStatus {
  Show = 'show',
  Hide = 'hide',
  Main = 'main',
}
