export const INITIAL_COUNT_OF_EACH_STATUS = 0;

export enum Error {
  ThisProjectAlreadyExists = 'This project already exists',
  NotFound = 'Project not found',
}

export enum Success {
  Created = 'Project created successfully',
  Updated = 'Project updated successfully',
  Deleted = 'Project deleted successfully',
}

export enum ProjectStatus {
  Show = 'show',
  Hide = 'hide',
  Popular = 'popular',
  Draft = 'draft',
}
