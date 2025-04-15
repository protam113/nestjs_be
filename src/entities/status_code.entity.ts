export enum StatusCode {
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
  Ok = 200,
  Created = 201,
  NoContent = 204,
  Conflict = 409,
  ServerError = 500,
}

export enum StatusType {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Error = 'ERROR',
  Warning = 'WARNING',
  Info = 'INFO',
}
