import { Router } from 'express';
import * as gatewayController from './gateway.controller.js';

const router = Router();

router.post('/connect', gatewayController.connect);
router.post('/heartbeat', gatewayController.heartbeat);
router.get('/commands', gatewayController.getCommands);
router.post('/call/trigger', gatewayController.triggerCall);
router.post('/call/start', gatewayController.startCall);
router.post('/call/end', gatewayController.endCall);
router.post('/disconnect', gatewayController.disconnect);

export default router;
