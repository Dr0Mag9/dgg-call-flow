import { Router } from 'express';
import * as gatewayController from './gateway.controller.js';

const router = Router();

router.post('/connect', gatewayController.connect);
router.post('/heartbeat', gatewayController.heartbeat);
router.post('/disconnect', gatewayController.disconnect);
router.post('/call/start', gatewayController.startCall);
router.post('/call/end', gatewayController.endCall);

export default router;
