import { User } from '../entities/User';

declare module 'express' {
  interface Request {
    user?: User;
  }
} 