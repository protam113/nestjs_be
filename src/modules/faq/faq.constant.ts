export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum Error {
  NotFound = 'NOT_FOUND',
  QuestionAlreadyExit = 'Question already exists (duplicate index)',
  QuestionRequired = 'Question and answer are required',
}

export enum Success {
  Created = 'FaQ created successfully',
  Updated = 'FaQ updated successfully',
}

export enum Message {
  FaqNotFound = 'FaQ not found',
  QuestionRequired = 'Question and answer are required',
  QuestionAlreadyExit = 'Question already exists (duplicate index)',
  InvalidStatus = 'Invalid status',
}

export enum FaqStatus {
  Show = 'show',
  Hide = 'hide',
  Main = 'main',
}

export const MAX_MAIN_FAQS = 4;
