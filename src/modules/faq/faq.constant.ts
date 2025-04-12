export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum Error {
  NotFound = 'FaQ not found',
  QuestionAlreadyExit = 'Question already exists (duplicate index)',
  QuestionRequired = 'Question and answer are required',
}

export enum Success {
  Created = 'FaQ created successfully',
  Updated = 'FaQ updated successfully',
}
