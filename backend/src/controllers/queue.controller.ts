import { Response, NextFunction } from 'express';
import { queueService } from '../services/queue.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class QueueController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: 'Query parameter "projectId" is required.' });
      }
      const data = await queueService.getQueues(projectId, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to list queues' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: 'Query parameter "projectId" is required.' });
      }
      const data = await queueService.getQueueById(id, projectId, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Queue not found' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const data = await queueService.createQueue(orgId, req.body);
      return res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Queue creation failed' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: 'Query parameter "projectId" is required to scope updates.' });
      }
      const data = await queueService.updateQueue(id, projectId, orgId, req.body);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Queue update failed' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: 'Query parameter "projectId" is required to scope deletion.' });
      }
      const success = await queueService.deleteQueue(id, projectId, orgId);
      return res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Queue deletion failed' });
    }
  }
}
export const queueController = new QueueController();
export default queueController;
