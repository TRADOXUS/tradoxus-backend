import { User } from '../../entities/User';

describe('User Entity', () => {
  it('should create a valid user entity', () => {
    // Create a valid user
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.isActive = true;

    // Check if properties are set correctly
    expect(user.nickname).toBe('validuser');
    expect(user.walletAddress).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(user.isActive).toBe(true);
  });

  it('should have expected class structure', () => {
    // Test the class structure rather than instance properties
    const UserClass = User;
    
    // Check that it's a named class
    expect(UserClass.name).toBe('User');
    
    // Create an instance to verify constructor works
    const user = new User();
    expect(user).toBeInstanceOf(User);
  });

  it('should allow null email', () => {
    // Create user with null email
    const user = new User();
    user.nickname = 'validuser';
    user.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    user.email = null;
    user.isActive = true;

    // Check if email is null
    expect(user.email).toBeNull();
  });
});