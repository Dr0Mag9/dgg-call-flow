import { Router } from 'express';
import * as materialsController from '../controllers/materials.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', materialsController.list);

export default router;
