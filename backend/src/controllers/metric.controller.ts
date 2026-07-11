import { Request, Response, NextFunction } from 'express';
import { metricService } from '../services/metric.service';

export class MetricController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await metricService.getSystemMetrics();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}
export const metricController = new MetricController();
