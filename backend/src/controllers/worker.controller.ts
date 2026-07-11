import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/worker.service';

export class WorkerController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workerService.getWorkers();
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to list workers' });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await workerService.getWorkerById(id);
      return res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Worker not found' });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Worker name is required.' });
      }
      const data = await workerService.registerWorker(name);
      return res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Worker registration failed' });
    }
  }

  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required to start.' });
      }
      const data = await workerService.startWorker(id);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to start worker daemon' });
    }
  }

  async stop(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required to stop.' });
      }
      const data = await workerService.stopWorker(id);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to stop worker daemon' });
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = await workerService.deleteWorker(id);
      return res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete worker record' });
    }
  }

  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await workerService.getHealthStats();
      return res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve health stats' });
    }
  }
}
export const workerController = new WorkerController();
export default workerController;
