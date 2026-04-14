import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', tasksController.list);
router.put('/:id', tasksController.update);

export default router;
