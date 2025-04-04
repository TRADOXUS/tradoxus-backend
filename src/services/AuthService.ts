import { Repository } from 'typeorm';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  constructor(
    private userRepository: Repository<User>
  ) {}

  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName
    });

    return this.userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { user, token };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 