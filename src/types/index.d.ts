import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface Request {
      socket: {
        remoteAddress: string | null;
      };
    }
  }
}
