import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSocketIo } from './services/websocket.service.js';
import { registerSocketHandlers } from './sockets/index.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = createServer(app);

initSocketIo(httpServer);
registerSocketHandlers();

httpServer.listen(env.PORT, env.HOST, () => {
  logger.info('HTTP server listening', { port: env.PORT, host: env.HOST, nodeEnv: env.NODE_ENV });
});
