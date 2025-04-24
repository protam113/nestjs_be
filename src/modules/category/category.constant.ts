export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CategoryRequired = 'Category name is required',
  InternalServer = 'Internal server error',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  NAME_REQUIRED = 'NAME_REQUIRED',
  CATEGORY_ALREADY_EXISTS = 'CATEGORY_ALREADY_EXISTS',
}

export enum Message {
  CategoryCreated = 'Category created successfully',
  CategoryUpdated = 'Category updated successfully',
  CategoryDeleted = 'Category deleted successfully',
  CategoryFound = 'Category found successfully',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
  InvalidStatus = 'Invalid status value',
  ThisCategoryAlreadyExists = 'This category already exists',
}

export enum Success {
  Created = 'Category created successfully',
  Updated = 'Category updated successfully',
  Deleted = 'Category deleted successfully',
}

export enum CategoryStatus {
  Show = 'show',
  Hide = 'hide',
  Draft = 'draft',
}

export const CATEGORY_CACHE_TTL = {
  CATEGORY_LIST: 3600,
  CATEGORY_DETAIL: 10800,
};
