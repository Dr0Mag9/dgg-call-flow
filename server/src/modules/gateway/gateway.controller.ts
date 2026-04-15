import { Request, Response } from 'express';
import * as gatewayService from './gateway.service.js';
import { sendError } from '../../utils/responses.js';

export async function connect(req: Request, res: Response) {
  // Support API key from body or header
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  const deviceName = req.body.deviceName || 'Android Device';

  if (!apiKey) {
    return sendError(res, 401, 'API Key required');
  }

  const result = await gatewayService.connectGateway(apiKey, deviceName);
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

export async function startCall(_req: Request, res: Response) {
  // Logic for call start logging
  return res.json({ success: true, message: 'Call start logged' });
}

export async function endCall(_req: Request, res: Response) {
  // Logic for call end logging
  return res.json({ success: true, message: 'Call end logged' });
}
