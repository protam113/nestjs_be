export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  FILE_REQUIRED = 'FILE_REQUIRED',
  CATEGORY_REQUIRED = 'CATEGORY_REQUIRED',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_VALIDATION = 'CATEGORY_VALIDATION',
  INVALID_CATEGORY_UUIDS = 'INVALID_CATEGORY_UUIDS',
  BLOG_ALREADY_EXISTS = 'BLOG_ALREADY_EXISTS',
  TITLE_REQUIRED = 'TITLE_REQUIRED',
  BLOG_NOT_FOUND = 'BLOG_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  INVALID_VIEWS_COUNT = 'INVALID_VIEWS_COUNT',
}

export enum Message {
  FailedUploadImage = 'Failed to upload blog image',
  BlogThumbnailRequired = ' Blog thumbnail image is required',
  CATEGORY_REQUIRED = 'Category is required',
  CategoryNotFound = 'Category not found',
  CategoryValidation = 'Category validation failed',
  InvalidCategoryUUIDs = 'Invalid category UUIDs provided',
  ThisBlogAlreadyExists = 'This blog already exists',
  BlogNotFound = 'Blog not found',
  InvalidCategoryId = 'Invalid category ID format',
  InvalidStatus = 'Invalid status value',
  InvalidViewsCount = 'Invalid views count',
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

export const BLOG_CACHE_TTL = {
  BLOG_LIST: 3600,
  BLOG_DETAIL: 10800,
};
