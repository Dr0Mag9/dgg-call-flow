import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();
router.use(authenticate);

router.get('/system', settingsController.getSystem);
router.post('/system', requireRole('ADMIN'), settingsController.postSystem);

export default router;
