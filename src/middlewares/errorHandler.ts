import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({
      message: 'Validation Error',
      errors
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(400).json({
      message: `${field} already exists`
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Token expired'
    });
    return;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      message: 'File too large'
    });
    return;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      message: 'Too many files or unexpected field'
    });
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
};
