import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { CreateJobSchema, JobQuerySchema, validateBody, validateQuery } from '../validators';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(JobQuerySchema), jobController.getAll.bind(jobController));
router.get('/:id', jobController.getById.bind(jobController));
router.post('/', validateBody(CreateJobSchema), jobController.create.bind(jobController));
router.delete('/:id', jobController.delete.bind(jobController));

router.post('/:id/cancel', jobController.cancel.bind(jobController));
router.post('/:id/retry', jobController.retry.bind(jobController));
router.get('/:id/logs', jobController.getLogs.bind(jobController));

export default router;
