import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

// Used to burn the same CPU time when the email doesn't exist, so response
// timing doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 12);

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // A concurrent duplicate is caught by the unique index (E11000 -> 409).
  const user = await User.create({ name, email, password });

  res.status(201).json({ success: true, user, token: generateToken(user._id) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ success: true, user, token: generateToken(user._id) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
