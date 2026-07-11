import { Router } from 'express';
import { jobController } from '../controllers/job.controller';

const router = Router();

// /api/retries/:jobId triggers a retry
router.post('/:id', jobController.retry.bind(jobController));

export default router;
