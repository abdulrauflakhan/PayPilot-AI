import { ApiError } from '../utils/ApiError.js';

// Validates req.body against a Zod schema and replaces it with the parsed
// (trimmed / normalised) data. Unknown fields are stripped by Zod.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(new ApiError(400, 'Validation failed', details));
  }
  req.body = result.data;
  next();
};
