export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisCategoryAlreadyExists = 'This category already exists',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
  InternalServer = 'Internal server error',
  NOT_FOUND = 'NOT_FOUND',
}

export enum Message {
  CategoryCreated = 'Category created successfully',
  CategoryUpdated = 'Category updated successfully',
  CategoryDeleted = 'Category deleted successfully',
  CategoryFound = 'Category found successfully',
  CategoryNotFound = 'Category not found',
  CategoryRequired = 'Category name is required',
}

export enum Success {
  Created = 'Category created successfully',
  Updated = 'Category updated successfully',
  Deleted = 'Category deleted successfully',
}
