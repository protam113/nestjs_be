export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisCategoryAlreadyExists = 'This category already exists',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
  InternalServer = 'Internal server error',
}

export enum Success {
  Created = 'Category created successfully',
  Updated = 'Category updated successfully',
  Deleted = 'Category deleted successfully',
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
