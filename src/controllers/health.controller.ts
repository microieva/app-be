import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import logger from '../configurations/logger';

export class HealthController extends BaseController {
  static async getHealth(req: Request, res: Response) {
    const correlationId: string = req.headers.correlationid as string;
    logger.info('Health check request received.', {
      correlationId,
      methodName: 'getHealth',
      fileName: 'health.controller.ts',
    });
    res.sendStatus(200);
  }
}
