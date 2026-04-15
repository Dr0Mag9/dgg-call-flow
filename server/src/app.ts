import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getCorsOptions } from './config/cors.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import agentsRoutes from './routes/agents.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import callsRoutes from './routes/calls.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import gatewayRoutes from './modules/gateway/gateway.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/calls', callsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/settings', webhooksRoutes);
  app.use('/api/gateway', gatewayRoutes);
  app.use('/api', webhooksRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);
  return app;
}
