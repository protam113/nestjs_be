export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisPricingAlreadyExists = 'This pricing already exists',
  PricingNotFound = 'Pricing not found',
  BadRequest = 'Bad Request',
}

export enum Success {
  Created = 'Pricing created successfully',
  Updated = 'Pricing updated successfully',
  Deleted = 'Pricing deleted successfully',
}

export enum StatusCode {
  Success = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  ServerError = 500,
}
