import { Request, Response, NextFunction } from 'express';
// import { CONSTANT } from '../utils/constant';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(`Error: ${err.message}`);
  res.status(500).send('500: Internal Server Error');
};
