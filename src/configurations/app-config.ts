import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';

export const configureApp = async (app: Application) => {
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());
};
