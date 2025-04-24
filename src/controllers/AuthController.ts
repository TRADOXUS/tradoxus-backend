import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../middleware/errorHandler';
import { RegisterDto, VerifyWalletDto } from '../dto/AuthDto';
import { BaseController } from './BaseController';
import { User } from '../entities/User';
import { validate, ValidationError } from 'class-validator';

export class AuthController extends BaseController<User> {
  constructor(private authService: AuthService) {
    super(User);
  }

  handleValidationErrors(errors: ValidationError[], res: Response) {
    const formattedErrors = errors.map((error) => {
      return {
        property: error.property,
        constraints: error.constraints,
      };
    });
    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  // Example of handling a generic error
  handleError(error: Error, res: Response) {
    console.error(error); // For debugging purposes, you can log the error
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }

  /**
   * Register a new user with email and password
   * @route POST /api/auth/register
   */
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

  /**
   * Register a new user with wallet connection
   * @route POST /api/auth/register-wallet
   */
  registerWithWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerDto = new RegisterDto();
      Object.assign(registerDto, req.body);

      // Validate DTO
      const errors = await validate(registerDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const result = await this.authService.registerWithWallet(registerDto);
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Login with email and password
   * @route POST /api/auth/login
   */
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

  /**
   * Generate nonce for wallet signature verification
   * @route GET /api/auth/nonce/:walletAddress
   */
  generateNonce = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        res.status(400).json({ message: 'Wallet address is required' });
        return;
      }

      const { message, nonce } = this.authService.generateNonce(walletAddress);
      res.status(200).json({ message, nonce });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify wallet signature
   * @route POST /api/auth/verify-wallet
   */
  verifyWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const verifyDto = new VerifyWalletDto();
      Object.assign(verifyDto, req.body);

      // Validate DTO
      const errors = await validate(verifyDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const result = await this.authService.verifyWallet(verifyDto);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Login with wallet
   * @route POST /api/auth/login-wallet
   */
  loginWithWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, signature } = req.body;

      if (!walletAddress || !signature) {
        res.status(400).json({ message: 'Wallet address and signature are required' });
        return;
      }

      const result = await this.authService.loginWithWallet(walletAddress, signature);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
