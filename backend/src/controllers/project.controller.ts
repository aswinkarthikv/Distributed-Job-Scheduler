import { Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ProjectController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const data = await projectService.getAllProjects(orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to list projects' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const data = await projectService.getProjectById(id, orgId);
      return res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Project not found' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { name, description } = req.body;
      const data = await projectService.createProject(name, description, orgId);
      return res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Project creation failed' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const data = await projectService.updateProject(id, orgId, req.body);
      return res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Project update failed' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const success = await projectService.deleteProject(id, orgId);
      return res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Project deletion failed' });
    }
  }
}
export const projectController = new ProjectController();
export default projectController;
