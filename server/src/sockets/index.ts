import { prisma } from '../config/prisma.js';
import { verifyToken } from '../utils/jwt.js';
import { getIo } from '../services/websocket.service.js';
import { broadcast } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

export function registerSocketHandlers() {
  const io = getIo();

  io.on('connection', (socket) => {
    socket.on('authenticate', async (token: unknown) => {
      try {
        if (typeof token !== 'string' || !token.trim()) {
          socket.emit('unauthorized', { message: 'Invalid token' });
          return;
        }
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) {
          socket.emit('unauthorized', { message: 'Invalid token' });
          return;
        }

        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;

        socket.join(`user_${decoded.userId}`);
        if (decoded.role === 'ADMIN') {
          socket.join('admins');
        }
        if (decoded.role === 'AGENT') {
          socket.join('agents');
          await prisma.user.update({
            where: { id: decoded.userId },
            data: { status: 'ONLINE' },
          });
          const agent = await prisma.agent.findUnique({ where: { userId: decoded.userId } });
          if (agent) {
            await prisma.agent.update({
              where: { id: agent.id },
              data: { status: 'ONLINE', lastSeenAt: new Date() },
            });
          }
          broadcast('agent_status_changed', { userId: decoded.userId, status: 'ONLINE' });
        }

        socket.emit('authenticated', { success: true });
      } catch {
        socket.emit('unauthorized', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', async () => {
      const userId = socket.data.userId as string | undefined;
      const role = socket.data.role as string | undefined;
      if (!userId || role !== 'AGENT') return;

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE' },
        });
        const agent = await prisma.agent.findUnique({ where: { userId } });
        if (agent) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: { status: 'OFFLINE', lastSeenAt: new Date() },
          });
        }
        broadcast('agent_status_changed', { userId, status: 'OFFLINE' });
      } catch (e) {
        logger.error('socket disconnect agent cleanup', {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    });
  });
}
