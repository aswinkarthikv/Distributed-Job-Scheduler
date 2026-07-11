import { Router } from 'express';
import { workerController } from '../controllers/worker.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', workerController.getAll.bind(workerController));
router.get('/health', workerController.getHealth.bind(workerController));
router.get('/:id', workerController.getById.bind(workerController));
router.post('/', workerController.create.bind(workerController));
router.delete('/:id', workerController.delete.bind(workerController));

router.post('/start', workerController.start.bind(workerController));
router.post('/stop', workerController.stop.bind(workerController));

export default router;
