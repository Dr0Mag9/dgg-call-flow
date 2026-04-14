import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

const clientUpdateKeys = new Set([
  'name',
  'phone',
  'email',
  'city',
  'company',
  'matterType',
  'source',
  'stage',
  'score',
  'priority',
  'status',
  'assignedAgentId',
  'nextFollowUpAt',
  'lastContactedAt',
  'lastOutcome',
  'tags',
]);

export function sanitizeClientUpdate(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!clientUpdateKeys.has(k)) continue;
    if (k === 'nextFollowUpAt' || k === 'lastContactedAt') {
      if (v === null || v === '') {
        out[k] = null;
      } else if (typeof v === 'string' || v instanceof Date) {
        out[k] = new Date(v);
      }
      continue;
    }
    if (k === 'score' && typeof v === 'number') {
      out[k] = v;
      continue;
    }
    if (typeof v === 'string' || typeof v === 'number' || v === null) {
      out[k] = v;
    }
  }
  return out;
}

export function listClients() {
  return prisma.client.findMany({
    include: { assignedAgent: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createClient(
  body: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    company?: string;
    matterType?: string;
    source?: string;
  },
  opts: { assignedAgentId?: string },
) {
  return prisma.client.create({
    data: {
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      city: body.city?.trim() || undefined,
      company: body.company?.trim() || undefined,
      matterType: body.matterType?.trim() || undefined,
      source: body.source?.trim() || 'Manual',
      stage: 'New Lead',
      assignedAgentId: opts.assignedAgentId,
    },
    include: { assignedAgent: { include: { user: true } } },
  });
}

export function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      assignedAgent: { include: { user: true } },
      notes: { include: { agent: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
      tasks: { include: { agent: { include: { user: true } } }, orderBy: { dueAt: 'asc' } },
      studyMaterials: true,
      predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
      calls: {
        include: { agent: { include: { user: true } }, disposition: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function updateClient(id: string, data: Record<string, unknown>) {
  const clean = sanitizeClientUpdate(data);
  return prisma.client.update({
    where: { id },
    data: clean as Prisma.ClientUpdateInput,
  });
}

export async function resolveActingAgentId(clientId: string, userId: string, role: string) {
  if (role === 'AGENT') {
    const agent = await prisma.agent.findUnique({ where: { userId } });
    return agent?.id ?? null;
  }
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { assignedAgentId: true },
  });
  if (client?.assignedAgentId) return client.assignedAgentId;
  const anyAgent = await prisma.agent.findFirst({ orderBy: { id: 'asc' } });
  return anyAgent?.id ?? null;
}

export async function createNote(
  clientId: string,
  data: { content: string; noteType?: string; isPrivate?: boolean; callId?: string },
  agentId: string,
) {
  return prisma.clientNote.create({
    data: {
      clientId,
      agentId,
      content: data.content.trim(),
      noteType: data.noteType?.trim() || 'general',
      isPrivate: Boolean(data.isPrivate),
      callId: data.callId,
    },
    include: { agent: { include: { user: true } } },
  });
}

export async function createTask(
  clientId: string,
  data: {
    title: string;
    description?: string;
    dueAt: string | number | Date;
    taskType: string;
    agentId?: string;
  },
  fallbackAgentId: string,
) {
  return prisma.clientTask.create({
    data: {
      clientId,
      agentId: data.agentId ?? fallbackAgentId,
      title: data.title.trim(),
      description: data.description?.trim(),
      dueAt: data.dueAt instanceof Date ? data.dueAt : new Date(data.dueAt),
      taskType: data.taskType,
    },
    include: { agent: { include: { user: true } } },
  });
}
