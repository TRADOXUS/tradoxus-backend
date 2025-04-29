import { AuthService } from '../../services/AuthService';
import { VerifyWalletDto } from '../../dto/AuthDto';
import { Repository } from 'typeorm';
import { User } from '../../entities/User';
import { AppDataSource } from '../../config/database';

// Mock the AppDataSource
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      save: jest.fn(),
    }),
  },
}));

// Mock wallet utilities
jest.mock('../../utils/walletUtils', () => ({
  generateSignMessage: jest.fn((address, nonce) => `Sign this message: ${nonce}`),
  verifySignature: jest.fn().mockReturnValue(true),
  toChecksumAddress: jest.fn(address => address),
}));

// Mock JWT utilities
jest.mock('../../utils/jwtUtils', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: Repository<User>;

  beforeEach(() => {
    mockUserRepository = AppDataSource.getRepository(User);
    authService = new AuthService(mockUserRepository);
    
    // Reset mock calls
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate a nonce for wallet address', () => {
      const result = authService.generateNonce('0x1234567890abcdef1234567890abcdef12345678');
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('nonce');
      expect(typeof result.nonce).toBe('string');
      expect(result.nonce.length).toBeGreaterThan(0);
    });
  });

  describe('verifyWallet', () => {
    it('should verify a valid wallet signature', async () => {
      // Setup - mock the internal verifyWalletOwnership method
      const originalMethod = (authService as any).verifyWalletOwnership;
      (authService as any).verifyWalletOwnership = jest.fn().mockResolvedValue(true);
      
      const verifyDto: VerifyWalletDto = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: 'valid-signature',
      };
      
      const result = await authService.verifyWallet(verifyDto);
      
      expect(result).toEqual({
        verified: true,
        message: 'Wallet verified successfully',
      });
      
      // Restore original method
      (authService as any).verifyWalletOwnership = originalMethod;
    });
  });
});