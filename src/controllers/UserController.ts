import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { UpdateUserDto } from '../dto/UserDto';
import { BaseController } from './BaseController';
import { validate } from 'class-validator';

export class UserController extends BaseController {
  private userService = new UserService();
  
  /**
   * Get current user profile
   * @route GET /api/users/me
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      const userProfile = await this.userService.getUserProfile(req.user.id);
      res.status(200).json(userProfile);
    } catch (error) {
      this.handleError(error, res);
    }
  };
  
  /**
   * Update user profile
   * @route PATCH /api/users/me
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      const updateDto = new UpdateUserDto();
      Object.assign(updateDto, req.body);
      
      // Validate DTO
      const errors = await validate(updateDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }
      
      const updatedProfile = await this.userService.updateUserProfile(req.user.id, updateDto);
      res.status(200).json(updatedProfile);
    } catch (error) {
      this.handleError(error, res);
    }
  };
  
  /**
   * Deactivate current user account
   * @route POST /api/users/me/deactivate
   */
  deactivateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      const result = await this.userService.deactivateUser(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };
}