import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UpdateUserDto, UserProfileDto } from '../dto/UserDto';
import { BaseService } from './BaseService';

export class UserService extends BaseService {
  private userRepository = AppDataSource.getRepository(User);
  
  /**
   * Get user profile by ID
   * @param userId User ID
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw this.createError('User not found', 404);
    }
    
    return {
      id: user.id,
      nickname: user.nickname,
      walletAddress: user.walletAddress,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  }
  
  /**
   * Update user profile
   * @param userId User ID
   * @param updateDto Data to update
   * @returns Updated user profile
   */
  async updateUserProfile(userId: string, updateDto: UpdateUserDto): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw this.createError('User not found', 404);
    }
    
    // Check if nickname is taken if being updated
    if (updateDto.nickname && updateDto.nickname !== user.nickname) {
      const existingNickname = await this.userRepository.findOne({ where: { nickname: updateDto.nickname } });
      if (existingNickname) {
        throw this.createError('Nickname is already taken', 409);
      }
      user.nickname = updateDto.nickname;
    }
    
    // Check if email is taken if being updated
    if (updateDto.email && updateDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({ where: { email: updateDto.email } });
      if (existingEmail) {
        throw this.createError('Email is already in use', 409);
      }
      user.email = updateDto.email;
    }
    
    const updatedUser = await this.userRepository.save(user);
    
    return {
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      walletAddress: updatedUser.walletAddress,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    };
  }
  
  /**
   * Get user by wallet address
   * @param walletAddress Ethereum wallet address
   * @returns User profile or null if not found
   */
  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { walletAddress } });
  }
  
  /**
   * Deactivate user account
   * @param userId User ID
   * @returns Success message
   */
  async deactivateUser(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw this.createError('User not found', 404);
    }
    
    user.isActive = false;
    await this.userRepository.save(user);
    
    return {
      success: true,
      message: 'User account deactivated successfully'
    };
  }
}