import { User } from "../entities/User";
// import config from '../config/config';

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
    walletAddress: user.walletAddress || "",
  };

  const mockToken = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `mock.${mockToken}.signature`;
};

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "mock") {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload as TokenPayload;
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
};
