import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(userId) {
  return jwt.sign({ id: String(userId) }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}
