import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/agents', adminController.listAgents);
router.get('/telephony-lines', adminController.listTelephonyLines);
router.post('/telephony-lines', adminController.createTelephonyLine);
router.delete('/telephony-lines/:id', adminController.deleteTelephonyLine);

router.get('/gateways', adminController.listGateways);
router.post('/gateways', adminController.createGateway);
router.delete('/gateways/:id', adminController.deleteGateway);

router.post('/agents', adminController.createAgent);
router.put('/agents/:id', adminController.updateAgent);
router.put('/agents/:id/toggle-status', adminController.toggleAgentStatus);
router.get('/agents/:id/activity', adminController.agentActivity);

export default router;
