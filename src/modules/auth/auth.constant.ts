export enum AuthStrategy {
  JWT = 'JWT',
  Secret = 'SECRET',
}
export enum AuthError {
  InvalidLoginCredentials = 'Invalid login credentials',
  InvalidToken = 'Invalid token',
  InvalidSecret = 'Invalid secret',
  AccessDenied = 'Access restricted to admin and manager users only',
  PasswordRequired = 'Password is required',
  UserRole = 'User role not found',
}

export enum AuthSuccess {
  LoginSuccess = 'Login successful',
  LogoutSuccess = 'Logout successful',
}
