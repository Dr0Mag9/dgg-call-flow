import type { Request, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(256),
  extension: z.string().max(32).optional(),
  assignedNumber: z.string().max(64).optional(),
  telephonyLineId: z.string().uuid().or(z.literal('')).nullable().optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  extension: z.string().max(32).optional(),
  assignedNumber: z.string().max(64).optional(),
  telephonyLineId: z.string().uuid().or(z.literal('')).nullable().optional(),
});

const createLineSchema = z.object({
  number: z.string().min(1),
  providerType: z.enum(['SIP', 'GATEWAY']),
  providerRef: z.string().optional(),
  gatewayId: z.string().min(1).or(z.literal('')).optional().nullable(),
});

const gatewaySchema = z.object({
  name: z.string().min(1),
});

export async function dashboard(_req: Request, res: Response) {
  const stats = await adminService.getDashboardStats();
  return res.json(stats);
}

export async function listAgents(_req: Request, res: Response) {
  const agents = await adminService.listAgents();
  return res.json(agents);
}

export async function listTelephonyLines(_req: Request, res: Response) {
  const lines = await adminService.listTelephonyLines();
  return res.json(lines);
}

export async function createTelephonyLine(req: Request, res: Response) {
  const parsed = createLineSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'Invalid line data');
  try {
    const line = await adminService.createTelephonyLine(parsed.data);
    return res.status(201).json(line);
  } catch (e) {
    return sendError(res, 400, 'Failed to create telephony line');
  }
}

export async function deleteTelephonyLine(req: Request, res: Response) {
  try {
    await adminService.deleteTelephonyLine(req.params.id);
    return res.status(204).end();
  } catch (e) {
    return sendError(res, 400, 'Failed to delete telephony line');
  }
}

export async function listGateways(_req: Request, res: Response) {
  const gateways = await adminService.listGateways();
  return res.json(gateways);
}

export async function createGateway(req: Request, res: Response) {
  const parsed = gatewaySchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'Invalid gateway data');
  try {
    const gateway = await adminService.createGateway(parsed.data.name);
    return res.status(201).json(gateway);
  } catch (e) {
    return sendError(res, 400, 'Failed to create gateway');
  }
}

export async function deleteGateway(req: Request, res: Response) {
  try {
    await adminService.deleteGateway(req.params.id);
    return res.status(204).end();
  } catch (e) {
    return sendError(res, 400, 'Failed to delete gateway');
  }
}

export async function createAgent(req: Request, res: Response) {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid agent data: ' + parsed.error.issues.map(i => i.message).join(', '));
  }
  try {
    const user = await adminService.createAgent({
      ...parsed.data,
      telephonyLineId: parsed.data.telephonyLineId ?? undefined
    });
    return res.status(201).json(user);
  } catch (e: any) {
    logger.error('createAgent', { message: e instanceof Error ? e.message : String(e) });
    if (e?.code === 'P2002') {
      return sendError(res, 409, 'An agent with this email already exists.');
    }
    return sendError(res, 400, 'Failed to create agent');
  }
}

export async function updateAgent(req: Request, res: Response) {
  const parsed = updateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid agent data');
  }
  try {
    const agent = await adminService.updateAgent(req.params.id, parsed.data);
    if (!agent) return sendError(res, 404, 'Agent not found');
    return res.json(agent);
  } catch (e: any) {
    logger.error('[Admin Controller] updateAgent Failure', { error: e.message, code: e.code });
    return sendError(res, 400, `Protocol Sync Failure: ${e.message || 'Unknown Error'}`);
  }
}

export async function toggleAgentStatus(req: Request, res: Response) {
  try {
    const updated = await adminService.toggleAgentStatus(req.params.id);
    if (!updated) return sendError(res, 404, 'Agent not found');
    return res.json(updated);
  } catch (e) {
    logger.error('toggleAgentStatus', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to toggle agent status');
  }
}

export async function agentActivity(req: Request, res: Response) {
  try {
    const data = await adminService.getAgentActivity(req.params.id);
    return res.json(data);
  } catch (e) {
    logger.error('agentActivity', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to fetch agent activity');
  }
}
