import { AuthService } from '../../services/AuthService';
import { RegisterDto, VerifyWalletDto } from '../../dto/AuthDto';
import { User } from '../../entities/User';
import * as walletUtils from '../../utils/walletUtils';
import * as jwtUtils from '../../utils/jwtUtils';

// Mock dependencies
jest.mock('typeorm', () => ({
  getRepository: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    save: jest.fn(),
  }),
}));

jest.mock('../../utils/walletUtils', () => ({
  generateSignMessage: jest.fn(),
  verifySignature: jest.fn(),
  toChecksumAddress: jest.fn(address => address.toLowerCase()),
}));

jest.mock('../../utils/jwtUtils', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    authService = new AuthService();
    mockUserRepository = require('typeorm').getRepository();
    
    // Reset mock calls
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with wallet address', async () => {
      // Mock data
      const registerDto: RegisterDto = {
        nickname: 'testuser',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
      };
      
      // Mock repository responses
      mockUserRepository.findOne.mockResolvedValueOnce(null); // No existing wallet
      mockUserRepository.findOne.mockResolvedValueOnce(null); // No existing nickname
      
      // Mock saving user
      const savedUser = new User();
      Object.assign(savedUser, {
        id: 'mock-uuid',
        nickname: registerDto.nickname,
        walletAddress: registerDto.walletAddress,
        email: null,
      });
      mockUserRepository.save.mockResolvedValueOnce(savedUser);
      
      // Mock signature verification
      (walletUtils.verifySignature as jest.Mock).mockReturnValueOnce(true);
      
      // Setup AuthService to verify wallet
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(true);
      
      // Execute
      const result = await authService.register(registerDto);
      
      // Verify
      expect(result).toEqual({
        user: {
          id: 'mock-uuid',
          nickname: registerDto.nickname,
          walletAddress: registerDto.walletAddress,
          email: null,
        },
        token: 'mock-jwt-token',
      });
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });

    it('should throw error if wallet signature is invalid', async () => {
      // Mock data
      const registerDto: RegisterDto = {
        nickname: 'testuser',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'invalid-signature',
      };
      
      // Setup AuthService to reject wallet verification
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(false);
      
      // Execute & verify
      await expect(authService.register(registerDto)).rejects.toThrow('Invalid wallet signature');
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });

    it('should throw error if wallet address is already registered', async () => {
      // Mock data
      const registerDto: RegisterDto = {
        nickname: 'testuser',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
      };
      
      // Setup AuthService to verify wallet
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(true);
      
      // Mock existing wallet
      const existingUser = new User();
      existingUser.id = 'existing-id';
      existingUser.walletAddress = registerDto.walletAddress;
      mockUserRepository.findOne.mockResolvedValueOnce(existingUser);
      
      // Execute & verify
      await expect(authService.register(registerDto)).rejects.toThrow('Wallet address is already registered');
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });

    it('should throw error if nickname is already taken', async () => {
      // Mock data
      const registerDto: RegisterDto = {
        nickname: 'testuser',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
      };
      
      // Setup AuthService to verify wallet
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(true);
      
      // Mock repository responses
      mockUserRepository.findOne.mockResolvedValueOnce(null); // No existing wallet
      
      // Mock existing nickname
      const existingUser = new User();
      existingUser.id = 'existing-id';
      existingUser.nickname = registerDto.nickname;
      mockUserRepository.findOne.mockResolvedValueOnce(existingUser);
      
      // Execute & verify
      await expect(authService.register(registerDto)).rejects.toThrow('Nickname is already taken');
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });
  });

  describe('verifyWallet', () => {
    it('should verify wallet ownership', async () => {
      // Mock data
      const verifyDto: VerifyWalletDto = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
      };
      
      // Setup AuthService to verify wallet
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(true);
      
      // Execute
      const result = await authService.verifyWallet(verifyDto);
      
      // Verify
      expect(result).toEqual({
        verified: true,
        message: 'Wallet verified successfully',
      });
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });

    it('should return false for invalid signature', async () => {
      // Mock data
      const verifyDto: VerifyWalletDto = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'invalid-signature',
      };
      
      // Setup AuthService to reject wallet verification
      const originalVerifyWalletOwnership = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValueOnce(false);
      
      // Execute
      const result = await authService.verifyWallet(verifyDto);
      
      // Verify
      expect(result).toEqual({
        verified: false,
        message: 'Invalid signature',
      });
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalVerifyWalletOwnership;
    });
  });
});