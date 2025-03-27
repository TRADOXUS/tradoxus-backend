import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import config from '../config/config';

interface TokenPayload {
  userId: string;
  walletAddress: string;
}

/**
 * Generate JWT token for authenticated user
 * @param user User entity
 * @returns JWT token string
 */
export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    walletAddress: user.walletAddress,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
};

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from authorization header
 * @param authHeader Authorization header value
 * @returns Token string or null if invalid format
 */
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};