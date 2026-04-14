import { Router } from 'express';
import * as agentsController from '../controllers/agents.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();
router.use(authenticate, requireRole('AGENT'));
router.get('/me', agentsController.me);

export default router;
