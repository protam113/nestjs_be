// src/types/express.d.ts
import { UserDocument } from '../entities/user.entity';

declare global {
  namespace Express {
    interface User {
      sub: string; // JWT payload thường có 'sub'
      email?: string;
      role?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
