import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwtUtils';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header is missing' });
      return;
    }
    
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      res.status(401).json({ message: 'Invalid token format' });
      return;
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    
    // Find user by ID from token
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    if (!user.isActive) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }
    
    // Attach user to request for use in controllers
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

