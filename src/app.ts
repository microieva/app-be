import 'dotenv/config'; 
require("reflect-metadata");
import express, { Application, NextFunction, Request, Response } from 'express';
import { configureApp } from './configurations/app-config';

class App {
  public express: Application = express();

  constructor() {
    this.config();
    this.setAccessControl();
    this.mountRoutes();
  }

  private setAccessControl() {
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With,Accept,Content-Type,Authorization',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  private mountRoutes(): void {
    this.express.get('/', (req, res) => {
      res.sendStatus(200);
    });

    // Convert null or false values to valid types as before
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      const convertNullOrFalse = (data: any) => {
        for (const key in data) {
          if (typeof data[key] === 'object') {
            convertNullOrFalse(data[key]);
            continue;
          }
          if (typeof data[key] !== 'string') {
            continue;
          }
          const value = data[key].toLowerCase();
          if (value === 'null') {
            data[key] = null;
          } else if (value === 'undefined') {
            data[key] = undefined;
          } else if (value === 'false') {
            data[key] = false;
          } else if (value === 'true') {
            data[key] = true;
          }
        }
      };
      try {
        convertNullOrFalse(req.body);
        convertNullOrFalse(req.query);
      } catch (err) {
        console.error(err.message);
      }
      next();
    });

    // Handle 404
    this.express.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Not Found.',
      });
    });
  }

  private async config(): Promise<void> {
    configureApp(this.express);
  }
}

export default new App().express;
