import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, orgName } = req.body;
      const result = await authService.register({ name, email, password, orgName });
      return res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Authentication failed' });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }
      const user = await authService.getMe(req.user.id);
      return res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to retrieve profile' });
    }
  }
}
export const authController = new AuthController();
export default authController;
