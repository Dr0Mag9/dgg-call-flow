import type { Request, Response } from 'express';
import { z } from 'zod';
import * as callsService from '../services/calls.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const outboundSchema = z.object({
  phoneNumber: z.string().min(5).max(32),
  clientId: z.string().uuid().optional(),
});

const inboundSchema = z.object({
  phoneNumber: z.string().min(5).max(32),
});

const dispositionSchema = z.object({
  outcome: z.string().min(1).max(120),
  notes: z.string().max(20000).optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  stageAfterCall: z.string().max(120).nullable().optional(),
});

export async function list(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  const calls = await callsService.listCalls(req.user.userId, req.user.role);
  res.json(calls);
}

export async function outbound(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  const parsed = outboundSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'Invalid payload');
    return;
  }
  const result = await callsService.createOutboundCall(
    req.user.userId,
    parsed.data.phoneNumber,
    parsed.data.clientId,
  );
  if (!result.ok) {
    sendError(res, 400, result.error);
    return;
  }
  res.json(result.call);
}

export async function inbound(req: Request, res: Response) {
  const parsed = inboundSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'Invalid payload');
    return;
  }
  try {
    const call = await callsService.createInboundCall(parsed.data.phoneNumber);
    res.json(call);
  } catch (e) {
    logger.error('inbound call', { message: e instanceof Error ? e.message : String(e) });
    sendError(res, 400, 'Failed to create inbound call');
  }
}

export async function answer(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    sendError(res, 400, 'Invalid call id');
    return;
  }
  try {
    const call = await callsService.answerCall(id);
    res.json(call);
  } catch (e) {
    logger.error('answer', { message: e instanceof Error ? e.message : String(e) });
    sendError(res, 400, 'Failed to answer call');
  }
}

export async function reject(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    sendError(res, 400, 'Invalid call id');
    return;
  }
  try {
    const call = await callsService.rejectCall(id);
    res.json(call);
  } catch (e) {
    logger.error('reject', { message: e instanceof Error ? e.message : String(e) });
    sendError(res, 400, 'Failed to reject call');
  }
}

export async function hangup(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    sendError(res, 400, 'Invalid call id');
    return;
  }
  const result = await callsService.hangupCall(id);
  if (!result.ok) {
    sendError(res, 404, result.error);
    return;
  }
  res.json(result.call);
}

export async function disposition(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  const { id } = req.params;
  if (!id) {
    sendError(res, 400, 'Invalid call id');
    return;
  }
  const parsed = dispositionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'Invalid disposition');
    return;
  }
  const result = await callsService.saveDisposition(id, req.user.userId, parsed.data);
  if (!result.ok) {
    sendError(res, 400, result.error);
    return;
  }
  res.json(result.disposition);
}
