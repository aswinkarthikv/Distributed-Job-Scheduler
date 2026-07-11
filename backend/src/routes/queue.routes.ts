import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { CreateQueueSchema, UpdateQueueSchema, validateBody } from '../validators';

const router = Router();

router.use(authMiddleware);

router.get('/', queueController.getAll.bind(queueController));
router.get('/:id', queueController.getById.bind(queueController));
router.post('/', validateBody(CreateQueueSchema), queueController.create.bind(queueController));
router.put('/:id', validateBody(UpdateQueueSchema), queueController.update.bind(queueController));
router.delete('/:id', queueController.delete.bind(queueController));

export default router;
