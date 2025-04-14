export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum Error {
  ThisBlogAlreadyExists = 'This blog already exists',
  BlogNotFound = 'Blog not found',
  InvalidCategoryId = 'Invalid category ID format',
  InvalidCategoryUUIDs = 'Invalid category UUIDs provided',
  CategoryNotFound = 'Category not found',
  CategoryValidation = 'Category validation failed',
}

export enum Success {
  Created = 'Blog created successfully',
  Updated = 'Blog updated successfully',
  Deleted = 'Blog deleted successfully',
}

export enum BlogStatus {
  Show = 'show',
  Hide = 'hide',
  Popular = 'popular',
  Draft = 'draft',
}
