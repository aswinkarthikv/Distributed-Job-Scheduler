import { Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class JobController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const query = req.query as any;

      const data = await jobService.getJobs(orgId, {
        projectId: query.projectId,
        queueId: query.queueId,
        status: query.status,
        search: query.search,
        fromDate: query.fromDate,
        toDate: query.toDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit
      });

      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to list jobs' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const data = await jobService.getJobById(id, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Job not found' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const data = await jobService.createJob(orgId, req.body);
      return res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Job creation failed' });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const data = await jobService.cancelJob(id, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Job cancellation failed' });
    }
  }

  async retry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const data = await jobService.triggerRetry(id, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Job retry dispatch failed' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const success = await jobService.deleteJob(id, orgId);
      return res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Job deletion failed' });
    }
  }

  async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const logs = await jobService.getJobLogs(id, orgId);
      return res.json(logs);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Failed to retrieve logs' });
    }
  }
}
export const jobController = new JobController();
export default jobController;
