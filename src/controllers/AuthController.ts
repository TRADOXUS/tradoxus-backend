import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const user = await this.authService.register(email, password, firstName, lastName);
      
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(400, error.message);
      }
      throw error;
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.authService.login(email, password);
      
      res.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          token
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(401, error.message);
      }
      throw error;
    }
  }
} 