import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export function initSocketIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
    allowEIO3: true,
  });
  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}
