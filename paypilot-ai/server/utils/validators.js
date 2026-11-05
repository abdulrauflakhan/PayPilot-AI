import { z } from 'zod';

// bcrypt silently ignores bytes past 72, so reject longer passwords explicitly.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 bytes')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must contain a letter and a number');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  // No strength rules on login: only check it's present.
  password: z.string().min(1, 'Password is required').max(200),
});
