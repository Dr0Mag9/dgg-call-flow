import { Router } from 'express';
import * as clientsController from '../controllers/clients.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', clientsController.list);
router.post('/', clientsController.create);
router.get('/:id', clientsController.getById);
router.put('/:id', clientsController.update);
router.post('/:id/notes', clientsController.addNote);
router.post('/:id/tasks', clientsController.addTask);

export default router;
