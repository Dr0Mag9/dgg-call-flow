import { getIo } from './websocket.service.js';

export function emitToUser(userId: string, event: string, payload: unknown) {
  try {
    getIo().to(`user_${userId}`).emit(event, payload);
  } catch {
    /* io not ready in tests */
  }
}

export function emitToAdmins(event: string, payload: unknown) {
  try {
    getIo().to('admins').emit(event, payload);
  } catch {
    /* noop */
  }
}

export function emitToAgents(event: string, payload: unknown) {
  try {
    getIo().to('agents').emit(event, payload);
  } catch {
    /* noop */
  }
}

export function broadcast(event: string, payload: unknown) {
  try {
    getIo().emit(event, payload);
  } catch {
    /* noop */
  }
}
