import type { Response } from 'express';

export function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

export function sendOk<T>(res: Response, status: number, data: T): void {
  res.status(status).json(data);
}
