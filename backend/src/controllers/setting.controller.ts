import { Request, Response, NextFunction } from 'express';

export class SettingController {
  private settings = {
    profile: { name: 'Staff Engineer', email: 'staff@enterprise.io' },
    organization: { name: 'Acme Jobs Corp', plan: 'Enterprise' },
    apiKeys: [
      { id: 'key-1', name: 'Production Agent', key: 'djs_prod_••••••••••••', createdAt: '2026-01-10T12:00:00Z' }
    ],
    retryPolicies: {
      defaultAttempts: 3,
      backoffFactor: 2,
      maxDelayMs: 30000
    }
  };

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(this.settings);
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      this.settings = { ...this.settings, ...req.body };
      res.json(this.settings);
    } catch (err) {
      next(err);
    }
  }
}
export const settingController = new SettingController();
