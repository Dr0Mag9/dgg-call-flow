import { Request, Response } from 'express';
import * as gatewayService from './gateway.service.js';
import { sendError } from '../../utils/responses.js';

export async function connect(req: Request, res: Response) {
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  const deviceName = req.body.deviceName || 'Android Device';
  const phoneNumber = req.body.phoneNumber;

  if (!apiKey) {
    return sendError(res, 401, 'API Key required');
  }

  const result = await gatewayService.connectGateway(apiKey, deviceName, phoneNumber);
  if (!result) {
    return sendError(res, 401, 'Invalid API Key');
  }

  return res.json({
    success: true,
    message: 'Connected',
    data: {
      deviceId: result.id,
      name: result.name
    }
  });
}

export async function heartbeat(req: Request, res: Response) {
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  
  if (!apiKey) {
    return sendError(res, 401, 'API Key required');
  }

  const result = await gatewayService.updateHeartbeat(apiKey);
  if (!result) {
    return sendError(res, 401, 'Invalid API Key');
  }

  return res.json({
    success: true,
    message: 'Heartbeat acknowledged'
  });
}

export async function triggerCall(req: Request, res: Response) {
  const { apiKey, phoneNumber, agentId } = req.body;
  const key = apiKey || req.headers['x-api-key'];

  if (!key || !phoneNumber) {
    return sendError(res, 400, 'API Key and Phone Number are required');
  }

  try {
    const session = await gatewayService.triggerCall(key, phoneNumber, agentId);
    return res.json({ 
      success: true, 
      message: 'Call trigger queued',
      callId: session.id 
    });
  } catch (err) {
    return sendError(res, 400, err instanceof Error ? err.message : 'Failed to trigger call');
  }
}

export async function getCommands(req: Request, res: Response) {
  const apiKey = req.query.apiKey as string || req.headers['x-api-key'] as string;

  if (!apiKey) {
    return sendError(res, 401, 'API Key required');
  }

  const commands = await gatewayService.getPendingCommands(apiKey);
  
  // If no commands, return a simple object as per user request flow if they prefer it
  // But returning an array of commands is more standard. 
  // User step 4: Return { "action": "CALL", "phoneNumber": "..." }
  if (commands.length === 0) {
    return res.json({ action: 'NONE' });
  }

  return res.json(commands[0]); // Return the first command for immediate processing
}

export async function startCall(req: Request, res: Response) {
  const { apiKey, callId } = req.body;
  const key = apiKey || req.headers['x-api-key'];
  
  if (!key || !callId) return sendError(res, 400, 'Missing parameters');

  await gatewayService.updateCallStatus(key, callId, 'RINGING');
  return res.json({ success: true, message: 'Call status updated to RINGING' });
}

export async function endCall(req: Request, res: Response) {
  const { apiKey, callId, status = 'ENDED' } = req.body;
  const key = apiKey || req.headers['x-api-key'];

  if (!key || !callId) return sendError(res, 400, 'Missing parameters');

  await gatewayService.updateCallStatus(key, callId, status);
  return res.json({ success: true, message: `Call status updated to ${status}` });
}

export async function disconnect(req: Request, res: Response) {
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  
  if (!apiKey) {
    return sendError(res, 401, 'API Key required');
  }

  await gatewayService.disconnectGateway(apiKey);

  return res.json({
    success: true,
    message: 'Disconnected'
  });
}
