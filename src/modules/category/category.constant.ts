export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisCategoryAlreadyExists = 'This category already exists',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
  InternalServer = 'Internal server error',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
}

export enum Message {
  CategoryCreated = 'Category created successfully',
  CategoryUpdated = 'Category updated successfully',
  CategoryDeleted = 'Category deleted successfully',
  CategoryFound = 'Category found successfully',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
  InvalidStatus = 'Invalid status value',
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
