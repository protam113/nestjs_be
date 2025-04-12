export const INITIAL_COUNT_OF_EACH_STATUS = 0;
export enum UserError {
  ThisEmailAlreadyExists = 'This email already exists',
  ThisUsernameAlreadyExists = 'This email already exists',
  InvalidUserStatus = 'Invalid user status',
  UserNotFound = 'User not found',
  RoleError = 'Only users with the Admin role can be deleted using this method',
  PasswordNotMatch = 'New password and confirmation do not match',
  CurrentIncorrect = 'Current password is incorrect',
  FailedVerification = 'Failed to send verification code',
  NoVerificationCode = ' No verification code found. Please request a new one.',
  VerificationExpired = 'Verification code has expired. Please request a new one.',
  InvalidVerification = 'Invalid verification code',
  PasswordNotFound = 'Password change request not found',
  FailedUpdatePassword = 'Failed to update password',
}

export enum UserSuccess {
  AccountCreated = 'Manager account created successfully',
  PasswordUpdated = 'Password updated successfully',
  VerificationSent = 'Verification code sent to your email',
  UserRetrieved = 'User retrieved successfully',
}
