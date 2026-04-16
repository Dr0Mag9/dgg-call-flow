import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

export async function getDashboardStats() {
  const totalAgents = await prisma.agent.count();
  const onlineAgents = await prisma.agent.count({ where: { status: 'ONLINE' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inboundCallsToday = await prisma.call.count({
    where: { direction: 'INBOUND', startedAt: { gte: today } },
  });
  const outboundCallsToday = await prisma.call.count({
    where: { direction: 'OUTBOUND', startedAt: { gte: today } },
  });
  const missedCalls = await prisma.call.count({
    where: { status: 'MISSED', startedAt: { gte: today } },
  });
  const activeCalls = await prisma.call.count({
    where: { status: { in: ['DIALING', 'RINGING', 'CONNECTED', 'ON_HOLD'] } },
  });

  return {
    totalAgents,
    onlineAgents,
    inboundCallsToday,
    outboundCallsToday,
    missedCalls,
    activeCalls,
  };
}

export function listAgents() {
  return prisma.agent.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, status: true, isActive: true } },
      telephonyLine: true,
    },
    orderBy: { user: { createdAt: 'desc' } },
  });
}

export function listTelephonyLines() {
  return prisma.telephonyLine.findMany({
    include: { gateway: true },
    orderBy: { number: 'asc' },
  });
}

export async function createTelephonyLine(data: any) {
  return prisma.telephonyLine.create({ data });
}

export async function deleteTelephonyLine(id: string) {
  return prisma.telephonyLine.delete({ where: { id } });
}

export async function listGateways() {
  return prisma.gatewayDevice.findMany({
    orderBy: { lastSeen: 'desc' },
  });
}

export async function createGateway(name: string) {
  const crypto = await import('crypto');
  const apiKey = `gw_${crypto.randomBytes(24).toString('hex')}`;
  return prisma.gatewayDevice.create({
    data: { name, apiKey, status: 'OFFLINE' }
  });
}

export async function deleteGateway(id: string) {
  return prisma.gatewayDevice.delete({ where: { id } });
}

export async function createAgent(data: {
  name: string;
  email: string;
  password: string;
  extension?: string;
  assignedNumber?: string;
  telephonyLineId?: string;
}) {
  const passwordHash = await hashPassword(data.password);
  // Normalize optional fields: empty strings → undefined (stored as NULL)
  const extension = data.extension?.trim() || undefined;
  const assignedNumber = data.assignedNumber?.trim() || undefined;
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
      role: 'AGENT',
      isActive: true,       // Explicit — never rely on DB default
      status: 'OFFLINE',    // Explicit — never rely on DB default
      agent: {
        create: {
          extension,
          assignedNumber,
          ...(data.telephonyLineId && { telephonyLineId: data.telephonyLineId }),
        },
      },
    },
    include: { agent: { include: { telephonyLine: true } } },
  });
}

export async function updateAgent(
  agentId: string,
  data: { name?: string; email?: string; extension?: string; assignedNumber?: string; telephonyLineId?: string | null },
) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return null;

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: {
      extension: data.extension,
      assignedNumber: data.assignedNumber,
      ...(data.telephonyLineId !== undefined && { telephonyLineId: data.telephonyLineId as any }),
      user: {
        update: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
        },
      },
    },
    include: { user: true, telephonyLine: true },
  });

  if (updated && updated.userId) {
    const { emitToUser } = await import('./notification.service.js');
    emitToUser(updated.userId, 'agent_telephony_updated', {});
  }

  return updated;
}

export async function toggleAgentStatus(agentId: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId }, include: { user: true } });
  if (!agent) return null;
  return prisma.user.update({
    where: { id: agent.userId },
    data: { isActive: !agent.user.isActive },
  });
}

export async function getAgentActivity(agentId: string) {
  const calls = await prisma.call.findMany({
    where: { agentId },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: { client: true, disposition: true },
  });
  const tasks = await prisma.clientTask.findMany({
    where: { agentId },
    orderBy: { dueAt: 'desc' },
    take: 10,
    include: { client: true },
  });
  return { calls, tasks };
}
