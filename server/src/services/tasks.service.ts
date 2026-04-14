import { prisma } from '../config/prisma.js';

export async function listTasksForUser(userId: string, role: string) {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  const where = role === 'AGENT' && agent ? { agentId: agent.id } : {};
  return prisma.clientTask.findMany({
    where,
    include: { client: true, agent: { include: { user: true } } },
    orderBy: { dueAt: 'asc' },
  });
}

function sanitizeTaskUpdate(data: Record<string, unknown>) {
  const allowed = new Set(['status', 'title', 'description', 'dueAt', 'taskType']);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!allowed.has(k)) continue;
    if (k === 'dueAt' && v != null && v !== '') {
      out[k] = new Date(String(v));
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function updateTask(id: string, data: Record<string, unknown>) {
  const clean = sanitizeTaskUpdate(data);
  return prisma.clientTask.update({
    where: { id },
    data: clean,
    include: { client: true, agent: { include: { user: true } } },
  });
}
