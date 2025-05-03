import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { UpdateUserDto } from "../dto/UserDto";
import { BaseController } from "./BaseController";
import { validate, ValidationError } from "class-validator";
import { User } from "../entities/User";

export class UserController extends BaseController<User> {
  private userService = new UserService(User);

  /**
   * Get current user profile
   * @route GET /api/users/me
   */
  handleValidationErrors(errors: ValidationError[], res: Response) {
    const formattedErrors = errors.map((error) => {
      return {
        property: error.property,
        constraints: error.constraints,
      };
    });
    res.status(400).json({
      error: "Validation failed",
      details: formattedErrors,
    });
  }

  // Example of handling a generic error
  handleError(error: Error, res: Response) {
    console.error(error); // For debugging purposes, you can log the error
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: "User not authenticated" });
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
        res.status(401).json({ message: "User not authenticated" });
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

      const updatedProfile = await this.userService.updateUserProfile(
        req.user.id,
        updateDto,
      );
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
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      const result = await this.userService.deactivateUser(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
