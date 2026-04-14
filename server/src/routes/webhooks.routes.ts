import { Router } from 'express';
import * as webhooksController from '../controllers/webhooks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();
router.use(authenticate);

router.get('/webhooks', webhooksController.list);
router.post('/webhooks', requireRole('ADMIN'), webhooksController.create);
router.put('/webhooks/:id', requireRole('ADMIN'), webhooksController.update);
router.delete('/webhooks/:id', requireRole('ADMIN'), webhooksController.remove);

export default router;
