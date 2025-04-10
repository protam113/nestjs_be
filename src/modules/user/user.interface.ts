// user.response.ts
export interface User {
  _id: string;
  name: string;
  username: string;
  password: string;
  role: string;
  email: string;
  phoneNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse {
  status: string;
  message: string;
  user: Omit<User, 'password'>;
}

export interface AuthResponse {
  user: UserResponse;
}

export interface UserData {
  _id: string;
  username: string;
  name: string;
  role: string;
}
