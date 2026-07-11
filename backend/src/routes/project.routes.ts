import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { CreateProjectSchema, UpdateProjectSchema, validateBody } from '../validators';

const router = Router();

router.use(authMiddleware);

router.get('/', projectController.getAll.bind(projectController));
router.get('/:id', projectController.getById.bind(projectController));
router.post('/', validateBody(CreateProjectSchema), projectController.create.bind(projectController));
router.put('/:id', validateBody(UpdateProjectSchema), projectController.update.bind(projectController));
router.delete('/:id', projectController.delete.bind(projectController));

export default router;
