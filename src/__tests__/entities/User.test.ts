import { validate } from 'class-validator';
import { User } from '../../entities/User';

describe('User Entity', () => {
  it('should validate a valid user entity', async () => {
    // Create a valid user
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.isActive = true;

    // Validate
    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with short nickname', async () => {
    // Create user with invalid nickname
    const user = new User();
    user.nickname = 'ab'; // Too short (less than 3 chars)
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.isActive = true;

    // Validate
    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    
    // Check if the error is about nickname length
    const nicknameErrors = errors.filter(error => 
      error.property === 'nickname' && 
      Object.keys(error.constraints || {}).some(key => 
        key.includes('length')
      )
    );
    expect(nicknameErrors.length).toBeGreaterThan(0);
  });

  it('should fail validation with invalid ethereum address', async () => {
    // Create user with invalid wallet address
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = 'not-an-ethereum-address';
    user.isActive = true;

    // Validate
    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    
    // Check if the error is about wallet address format
    const walletErrors = errors.filter(error => 
      error.property === 'walletAddress' && 
      Object.keys(error.constraints || {}).some(key => 
        key.includes('ethereumAddress')
      )
    );
    expect(walletErrors.length).toBeGreaterThan(0);
  });

  it('should fail validation with invalid email', async () => {
    // Create user with invalid email
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.email = 'not-an-email';
    user.isActive = true;

    // Validate
    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    
    // Check if the error is about email format
    const emailErrors = errors.filter(error => 
      error.property === 'email' && 
      Object.keys(error.constraints || {}).some(key => 
        key.includes('email')
      )
    );
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it('should allow null email', async () => {
    // Create user with null email
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.email = null;
    user.isActive = true;

    // Validate
    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });
});