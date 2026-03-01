import type { ErrorHandler } from 'hono';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode as 400);
  }

  return c.json({ error: 'Internal Server Error' }, 500);
};
