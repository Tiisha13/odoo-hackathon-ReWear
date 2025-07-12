import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenGenerator {
  static generateToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: '24h',
    };
    
    return jwt.sign(payload, config.jwtSecret as string, options);
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret as string) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
