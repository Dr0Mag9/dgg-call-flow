import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import * as clientsService from '../services/clients.service.js';
import { broadcast } from '../services/notification.service.js';
import { fireWebhooks } from '../services/webhooks.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(32),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().max(120).optional(),
  company: z.string().max(200).optional(),
  matterType: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
  assignedAgentId: z.string().uuid().or(z.literal('')).nullable().optional(),
});

const noteSchema = z.object({
  content: z.string().min(1).max(20000),
  noteType: z.string().max(64).optional(),
  isPrivate: z.boolean().optional(),
  callId: z.string().uuid().or(z.literal('')).nullable().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  dueAt: z.union([z.string().min(1), z.number()]),
  taskType: z.string().min(1).max(64),
  agentId: z.string().uuid().or(z.literal('')).nullable().optional(),
});

export async function list(_req: Request, res: Response) {
  const clients = await clientsService.listClients();
  return res.json(clients);
}

export async function create(req: Request, res: Response) {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid client data');
  }
  const body = parsed.data;
  let assignedAgentId = body.assignedAgentId;

  if (req.user.role === 'AGENT') {
    const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
    assignedAgentId = assignedAgentId ?? agent?.id;
  }

  try {
    const client = await clientsService.createClient(
      {
        name: body.name,
        phone: body.phone,
        email: body.email || undefined,
        city: body.city,
        company: body.company,
        matterType: body.matterType,
        source: body.source,
      },
      { assignedAgentId: assignedAgentId ?? undefined },
    );
    broadcast('client_created', client);
    fireWebhooks('client_created', client).catch(() => undefined);
    return res.json(client);
  } catch (e) {
    logger.error('create client', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to create client');
  }
}

export async function getById(req: Request, res: Response) {
  const client = await clientsService.getClientById(req.params.id);
  if (!client) return sendError(res, 404, 'Client not found');
  return res.json(client);
}

export async function update(req: Request, res: Response) {
  try {
    const client = await clientsService.updateClient(req.params.id, req.body as Record<string, unknown>);
    broadcast('client_updated', client);
    fireWebhooks('client_updated', client).catch(() => undefined);
    return res.json(client);
  } catch (e) {
    logger.error('update client', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to update client');
  }
}

export async function addNote(req: Request, res: Response) {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid note');
  }
  const agentId = await clientsService.resolveActingAgentId(req.params.id, req.user.userId, req.user.role);
  if (!agentId) {
    return sendError(res, 400, 'Could not resolve agent for note');
  }
  const note = await clientsService.createNote(req.params.id, {
    ...parsed.data,
    callId: parsed.data.callId ?? undefined
  }, agentId);
  broadcast('note_created', note);
  fireWebhooks('note_created', note).catch(() => undefined);
  return res.json(note);
}

export async function addTask(req: Request, res: Response) {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid task');
  }
  const fallbackAgentId = await clientsService.resolveActingAgentId(req.params.id, req.user.userId, req.user.role);
  if (!fallbackAgentId) {
    return sendError(res, 400, 'Could not resolve agent for task');
  }
  const task = await clientsService.createTask(req.params.id, {
    ...parsed.data,
    agentId: parsed.data.agentId ?? undefined
  }, fallbackAgentId);
  broadcast('task_created', task);
  fireWebhooks('task_created', task).catch(() => undefined);
  return res.json(task);
}
