import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { broadcast, emitToAdmins, emitToUser } from './notification.service.js';
import { fireWebhooks } from './webhooks.service.js';
import { pickInboundAgent } from './callRouting.service.js';
import { sipProvider } from './telephony/SipProvider.js';
import { gatewayProvider } from './telephony/GatewayProvider.js';

const outboundTimers = new Map<string, NodeJS.Timeout>();

export function cancelOutboundSimulation(callId: string) {
  const t = outboundTimers.get(callId);
  if (t) {
    clearTimeout(t);
    outboundTimers.delete(callId);
  }
}

const callListInclude = {
  client: true,
  agent: { include: { user: { select: { name: true, id: true, email: true } } } },
  disposition: true,
} as const;

export async function listCalls(userId: string, role: string) {
  const where = role === 'AGENT' ? { agent: { userId } } : {};
  return prisma.call.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: callListInclude,
  });
}

export async function createOutboundCall(userId: string, phoneNumber: string, clientId?: string) {
  const agent = await prisma.agent.findUnique({ 
    where: { userId },
    include: { telephonyLine: true }
  });
  
  if (!agent) return { ok: false as const, error: 'Agent not found' };
  
  if (!agent.telephonyLine) {
    return { ok: false as const, error: 'No authorized Indian business line assigned to this agent.' };
  }

  const call = await prisma.call.create({
    data: {
      direction: 'OUTBOUND',
      status: 'DIALING',
      phoneNumber: phoneNumber.trim(),
      clientId: clientId || undefined,
      agentId: agent.id,
      assignedLine: agent.telephonyLine.number,
      callerIdShown: agent.telephonyLine.number,
      providerType: agent.telephonyLine.providerType,
    },
    include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true },
  });

  const provider = agent.telephonyLine.providerType === 'GATEWAY' ? gatewayProvider : sipProvider;
  
  const result = await provider.initiateOutboundCall({
    callId: call.id,
    agentId: agent.id,
    phoneNumber: phoneNumber.trim(),
    lineId: agent.telephonyLine.id
  });

  if (!result.success) {
    await prisma.call.update({
      where: { id: call.id },
      data: { status: 'FAILED' }
    });
    return { ok: false as const, error: (result as { error?: string }).error || 'Telephony provider failed to initiate call' };
  }

  // Update call with provider ref
  const updatedCall = await prisma.call.update({
    where: { id: call.id },
    data: { providerRef: result.externalId },
    include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true },
  });

  emitToUser(userId, 'call_started', updatedCall);
  emitToAdmins('call_created', updatedCall);
  fireWebhooks('call_started', updatedCall).catch(() => undefined);

  // In a real integration, the provider events (SIP progression or Gateway WS events) 
  // will handle the CONNECTED state transition. For mock flow, we retain the schedule out.
  scheduleOutboundConnect(call.id, userId);

  return { ok: true as const, call: updatedCall };
}

function scheduleOutboundConnect(callId: string, userId: string) {
  const ms = env.OUTBOUND_SIMULATE_CONNECT_MS;
  if (ms <= 0) return;

  cancelOutboundSimulation(callId);

  const handle = setTimeout(() => {
    outboundTimers.delete(callId);
    void (async () => {
      try {
        const existing = await prisma.call.findUnique({ where: { id: callId } });
        if (!existing || !['DIALING'].includes(existing.status)) return;

        const connectedCall = await prisma.call.update({
          where: { id: callId },
          data: { status: 'CONNECTED' },
          include: {
            client: true,
            agent: { include: { user: { select: { name: true } } } },
            disposition: true,
          },
        });

        emitToUser(userId, 'call_connected', connectedCall);
        emitToAdmins('call_updated', connectedCall);
        broadcast('call_updated', connectedCall);
        fireWebhooks('call_connected', connectedCall).catch(() => undefined);
      } catch (e) {
        logger.error('Outbound simulation failed', { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, ms);

  outboundTimers.set(callId, handle);
}

export async function createInboundCall(phoneNumber: string) {
  const normalized = phoneNumber.trim();
  const client = await prisma.client.findUnique({ where: { phone: normalized } });
  const routed = await pickInboundAgent();

  const call = await prisma.call.create({
    data: {
      direction: 'INBOUND',
      status: 'RINGING',
      phoneNumber: normalized,
      clientId: client?.id,
      agentId: routed?.id,
    },
    include: {
      client: true,
      agent: { include: { user: { select: { name: true, id: true } } } },
      disposition: true,
    },
  });

  if (routed) {
    emitToUser(routed.userId, 'incoming_call', call);
  }
  emitToAdmins('call_created', call);
  fireWebhooks('incoming_call', call).catch(() => undefined);

  return call;
}

export async function answerCall(callId: string) {
  cancelOutboundSimulation(callId);
  const call = await prisma.call.update({
    where: { id: callId },
    data: { status: 'CONNECTED' },
    include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true },
  });
  broadcast('call_updated', call);
  broadcast('call_ended', call);
  emitToAdmins('call_updated', call);
  if (call.agent?.userId) {
    emitToUser(call.agent.userId, 'call_updated', call);
    emitToUser(call.agent.userId, 'call_ended', call);
  }
  return call;
}

export async function rejectCall(callId: string) {
  cancelOutboundSimulation(callId);
  const call = await prisma.call.update({
    where: { id: callId },
    data: { status: 'REJECTED', endedAt: new Date() },
    include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true },
  });
  broadcast('call_updated', call);
  fireWebhooks('call_rejected', call).catch(() => undefined);
  return call;
}

export async function hangupCall(callId: string) {
  cancelOutboundSimulation(callId);

  const existingCall = await prisma.call.findUnique({ where: { id: callId } });
  if (!existingCall) return { ok: false as const, error: 'Call not found' };

  const duration = existingCall.startedAt
    ? Math.floor((Date.now() - existingCall.startedAt.getTime()) / 1000)
    : 0;

  const autoRecordSetting = await prisma.systemSetting.findUnique({ where: { key: 'auto_record' } });
  const isAutoRecordEnabled = autoRecordSetting?.value === 'true';
  const recordingUrl =
    isAutoRecordEnabled && !existingCall.recordingUrl
      ? `https://storage.googleapis.com/my-advocate-recordings/call_${callId}.mp3`
      : existingCall.recordingUrl;

  const call = await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
      duration,
      recordingUrl: recordingUrl ?? undefined,
    },
    include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true },
  });

  broadcast('call_updated', call);
  emitToAdmins('call_updated', call);
  if (call.agent?.userId) {
    emitToUser(call.agent.userId, 'call_updated', call);
  }
  fireWebhooks('call_ended', call).catch(() => undefined);

  return { ok: true as const, call };
}

export async function saveDisposition(
  callId: string,
  userId: string,
  body: { outcome: string; notes?: string; nextFollowUpAt?: string | null; stageAfterCall?: string | null },
) {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || !call.clientId) return { ok: false as const, error: 'Call or Client not found' };

  let agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent && call.agentId) {
    agent = await prisma.agent.findUnique({ where: { id: call.agentId } });
  }
  if (!agent) return { ok: false as const, error: 'Agent not found' };

  const disposition = await prisma.callDisposition.upsert({
    where: { callId },
    update: {
      outcome: body.outcome,
      notes: body.notes?.trim(),
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
      stageAfterCall: body.stageAfterCall ?? undefined,
    },
    create: {
      callId,
      clientId: call.clientId,
      agentId: agent.id,
      outcome: body.outcome,
      notes: body.notes?.trim(),
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
      stageAfterCall: body.stageAfterCall ?? undefined,
    },
    include: {
      call: true,
      agent: { include: { user: true } },
      client: true,
    },
  });

  if (body.stageAfterCall || body.nextFollowUpAt) {
    await prisma.client.update({
      where: { id: call.clientId },
      data: {
        ...(body.stageAfterCall && { stage: body.stageAfterCall }),
        ...(body.nextFollowUpAt && { nextFollowUpAt: new Date(body.nextFollowUpAt) }),
        lastContactedAt: new Date(),
      },
    });
  }

  // Create a ClientNote so it appears in the Client Drawer notes tab
  await prisma.clientNote.create({
    data: {
      clientId: call.clientId,
      callId,
      agentId: agent.id,
      content: `Call Outcome: ${body.outcome}${body.notes ? '\n\n' + body.notes.trim() : ''}`,
      noteType: 'Call Record',
    }
  });

  broadcast('disposition_saved', disposition);
  fireWebhooks('disposition_saved', disposition).catch(() => undefined);

  return { ok: true as const, disposition };
}
