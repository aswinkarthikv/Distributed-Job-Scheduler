import { Router } from 'express';
import { metricController } from '../controllers/metric.controller';

const router = Router();

router.get('/', metricController.getStats.bind(metricController));

export default router;
