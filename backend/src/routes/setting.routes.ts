import { Router } from 'express';
import { settingController } from '../controllers/setting.controller';

const router = Router();

router.get('/', settingController.getSettings.bind(settingController));
router.put('/', settingController.updateSettings.bind(settingController));

export default router;
