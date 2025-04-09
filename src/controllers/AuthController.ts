import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RegisterDto, VerifyWalletDto } from '../dto/AuthDto';
import { BaseController } from './BaseController';
import { User } from 'src/entities/User';
import { validate, ValidationError } from 'class-validator';

export class AuthController extends BaseController<User> {
  private authService = new AuthService(User);

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
   * Register a new user with wallet connection
   * @route POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerDto = new RegisterDto();
      Object.assign(registerDto, req.body);

      // Validate DTO
      const errors = await validate(registerDto);
      if (errors.length > 0) {
        this.handleValidationErrors(errors, res);
        return;
      }

      const result = await this.authService.register(registerDto);
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

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
   * @route POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
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