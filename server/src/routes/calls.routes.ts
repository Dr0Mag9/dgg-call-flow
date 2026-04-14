import { Router } from 'express';
import * as callsController from '../controllers/calls.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireInboundSecret } from '../middleware/inboundAuth.js';

const router = Router();

router.post('/inbound', requireInboundSecret, callsController.inbound);

router.use(authenticate);

router.get('/', callsController.list);
router.post('/outbound', callsController.outbound);
router.post('/:id/answer', callsController.answer);
router.post('/:id/reject', callsController.reject);
router.post('/:id/hangup', callsController.hangup);
router.post('/:id/disposition', callsController.disposition);

export default router;
