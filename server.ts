/**
 * Legacy dev server: Express + Vite in one process.
 * Prefer the modular API in `/server` (see `server/DEPLOYMENT.md` and root `npm run dev`).
 */
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-demo';

// Webhook Helper
async function fireWebhooks(event: string, payload: any) {
  try {
    const webhooks = await prisma.webhook.findMany({ where: { isActive: true } });
    for (const webhook of webhooks) {
      let shouldFire = false;
      try {
        const events = JSON.parse(webhook.events);
        if (events.length === 0 || events.includes(event)) {
          shouldFire = true;
        }
      } catch (e) {
        shouldFire = true; // Fallback to fire all if parsing fails
      }

      if (shouldFire) {
        fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(webhook.secret ? { 'X-Webhook-Secret': webhook.secret } : {})
          },
          body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() })
        }).catch(err => console.error(`Failed to fire webhook ${webhook.name}:`, err));
      }
    }
  } catch (error) {
    console.error('Error firing webhooks:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  // --- Sockets ---
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        socket.join(`user_${decoded.userId}`);
        if (decoded.role === 'ADMIN') {
          socket.join('admins');
        }
        
        // Update agent status to ONLINE
        if (decoded.role === 'AGENT') {
          await prisma.user.update({
            where: { id: decoded.userId },
            data: { status: 'ONLINE' }
          });
          const agent = await prisma.agent.findUnique({ where: { userId: decoded.userId } });
          if (agent) {
            await prisma.agent.update({
              where: { id: agent.id },
              data: { status: 'ONLINE', lastSeenAt: new Date() }
            });
          }
          io.emit('agent_status_changed', { userId: decoded.userId, status: 'ONLINE' });
        }
        
        socket.emit('authenticated', { success: true });
      } catch (err) {
        socket.emit('unauthorized', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      if (socket.data.userId && socket.data.role === 'AGENT') {
        await prisma.user.update({
          where: { id: socket.data.userId },
          data: { status: 'OFFLINE' }
        });
        const agent = await prisma.agent.findUnique({ where: { userId: socket.data.userId } });
        if (agent) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: { status: 'OFFLINE', lastSeenAt: new Date() }
          });
        }
        io.emit('agent_status_changed', { userId: socket.data.userId, status: 'OFFLINE' });
      }
    });
  });

  // --- Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const requireRole = (role: string) => (req: any, res: any, next: any) => {
    if (req.user.role !== role) return res.sendStatus(403);
    next();
  };

  // --- API Routes ---
  
  // Auth
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, status: true, agent: true }
    });
    res.json(user);
  });

  // Admin
  app.get('/api/admin/dashboard', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    const totalAgents = await prisma.agent.count();
    const onlineAgents = await prisma.agent.count({ where: { status: 'ONLINE' } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const inboundCallsToday = await prisma.call.count({ where: { direction: 'INBOUND', startedAt: { gte: today } } });
    const outboundCallsToday = await prisma.call.count({ where: { direction: 'OUTBOUND', startedAt: { gte: today } } });
    const missedCalls = await prisma.call.count({ where: { status: 'MISSED', startedAt: { gte: today } } });
    const activeCalls = await prisma.call.count({ where: { status: { in: ['DIALING', 'RINGING', 'CONNECTED', 'ON_HOLD'] } } });

    res.json({
      totalAgents,
      onlineAgents,
      inboundCallsToday,
      outboundCallsToday,
      missedCalls,
      activeCalls
    });
  });

  app.get('/api/admin/agents', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    const agents = await prisma.agent.findMany({
      include: { user: { select: { id: true, name: true, email: true, status: true, isActive: true } } }
    });
    res.json(agents);
  });

  app.post('/api/admin/agents', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const { name, email, password, extension, assignedNumber } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'AGENT',
          agent: {
            create: {
              extension,
              assignedNumber
            }
          }
        },
        include: { agent: true }
      });
      res.json(user);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(400).json({ error: 'Failed to create agent' });
    }
  });

  app.put('/api/admin/agents/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const { id } = req.params; // Agent ID
      const { name, email, extension, assignedNumber } = req.body;
      
      const agent = await prisma.agent.update({
        where: { id },
        data: {
          extension,
          assignedNumber,
          user: {
            update: {
              name,
              email
            }
          }
        },
        include: { user: true }
      });
      res.json(agent);
    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(400).json({ error: 'Failed to update agent' });
    }
  });

  app.put('/api/admin/agents/:id/toggle-status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const { id } = req.params; // Agent ID
      const agent = await prisma.agent.findUnique({ where: { id }, include: { user: true } });
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      
      const updatedUser = await prisma.user.update({
        where: { id: agent.userId },
        data: { isActive: !agent.user.isActive }
      });
      res.json(updatedUser);
    } catch (error) {
      console.error('Error toggling agent status:', error);
      res.status(400).json({ error: 'Failed to toggle agent status' });
    }
  });

  app.get('/api/admin/agents/:id/activity', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const { id } = req.params; // Agent ID
      const calls = await prisma.call.findMany({
        where: { agentId: id },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: { client: true, disposition: true }
      });
      const tasks = await prisma.clientTask.findMany({
        where: { agentId: id },
        orderBy: { dueAt: 'desc' },
        take: 10,
        include: { client: true }
      });
      res.json({ calls, tasks });
    } catch (error) {
      console.error('Error fetching agent activity:', error);
      res.status(400).json({ error: 'Failed to fetch agent activity' });
    }
  });

  // Webhooks
  app.get('/api/settings/webhooks', authenticateToken, async (req, res) => {
    const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(webhooks);
  });

  // System Settings
  app.get('/api/settings/system', authenticateToken, async (req, res) => {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(settingsMap);
  });

  app.post('/api/settings/system', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const { key, value } = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
      res.json(setting);
    } catch (error) {
      console.error('Error saving system setting:', error);
      res.status(400).json({ error: 'Failed to save system setting' });
    }
  });

  app.post('/api/settings/webhooks', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const webhook = await prisma.webhook.create({ data: req.body });
      res.json(webhook);
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(400).json({ error: 'Failed to create webhook' });
    }
  });

  app.put('/api/settings/webhooks/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      const webhook = await prisma.webhook.update({
        where: { id: req.params.id },
        data: req.body
      });
      res.json(webhook);
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(400).json({ error: 'Failed to update webhook' });
    }
  });

  app.delete('/api/settings/webhooks/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
      await prisma.webhook.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(400).json({ error: 'Failed to delete webhook' });
    }
  });

  // Clients (formerly Contacts)
  app.get('/api/clients', authenticateToken, async (req, res) => {
    const clients = await prisma.client.findMany({
      include: { assignedAgent: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  });

  app.post('/api/clients', authenticateToken, async (req: any, res) => {
    try {
      const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
      const assignedAgentId = req.body.assignedAgentId || agent?.id;
      
      const client = await prisma.client.create({
        data: {
          name: req.body.name,
          phone: req.body.phone,
          email: req.body.email,
          city: req.body.city,
          company: req.body.company,
          matterType: req.body.matterType,
          source: req.body.source || 'Manual',
          stage: 'New Lead',
          assignedAgentId: assignedAgentId
        },
        include: { assignedAgent: { include: { user: true } } }
      });
      io.emit('client_created', client);
      fireWebhooks('client_created', client);
      res.json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(400).json({ error: 'Failed to create client' });
    }
  });

  app.get('/api/clients/:id', authenticateToken, async (req, res) => {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { 
        assignedAgent: { include: { user: true } },
        notes: { include: { agent: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        tasks: { include: { agent: { include: { user: true } } }, orderBy: { dueAt: 'asc' } },
        studyMaterials: true,
        predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
        calls: { include: { agent: { include: { user: true } }, disposition: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    res.json(client);
  });

  app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    try {
      const client = await prisma.client.update({
        where: { id: req.params.id },
        data: req.body
      });
      io.emit('client_updated', client);
      res.json(client);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(400).json({ error: 'Failed to update client' });
    }
  });

  // Notes
  app.post('/api/clients/:id/notes', authenticateToken, async (req: any, res) => {
    const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
    if (!agent) return res.status(400).json({ error: 'Agent not found' });

    const note = await prisma.clientNote.create({
      data: {
        clientId: req.params.id,
        agentId: agent.id,
        content: req.body.content,
        noteType: req.body.noteType || 'general',
        isPrivate: req.body.isPrivate || false,
        callId: req.body.callId
      },
      include: { agent: { include: { user: true } } }
    });
    io.emit('note_created', note);
    res.json(note);
  });

  // Tasks
  app.post('/api/clients/:id/tasks', authenticateToken, async (req: any, res) => {
    const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
    if (!agent) return res.status(400).json({ error: 'Agent not found' });

    const task = await prisma.clientTask.create({
      data: {
        clientId: req.params.id,
        agentId: req.body.agentId || agent.id,
        title: req.body.title,
        description: req.body.description,
        dueAt: new Date(req.body.dueAt),
        taskType: req.body.taskType
      },
      include: { agent: { include: { user: true } } }
    });
    io.emit('task_created', task);
    res.json(task);
  });

  app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
      const task = await prisma.clientTask.update({
        where: { id: req.params.id },
        data: req.body,
        include: { client: true }
      });
      io.emit('task_updated', task);
      if (req.body.status === 'COMPLETED') {
        fireWebhooks('task_completed', task);
      }
      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(400).json({ error: 'Failed to update task' });
    }
  });

  app.get('/api/tasks', authenticateToken, async (req: any, res) => {
    const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
    const where = req.user.role === 'AGENT' && agent ? { agentId: agent.id } : {};
    const tasks = await prisma.clientTask.findMany({
      where,
      include: { client: true },
      orderBy: { dueAt: 'asc' }
    });
    res.json(tasks);
  });

  // Study Materials
  app.get('/api/materials', authenticateToken, async (req, res) => {
    const materials = await prisma.studyMaterial.findMany({
      where: { active: true, clientId: null }
    });
    res.json(materials);
  });

  // Calls
  app.get('/api/calls', authenticateToken, async (req: any, res) => {
    const where = req.user.role === 'AGENT' ? { agent: { userId: req.user.userId } } : {};
    const calls = await prisma.call.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: true, agent: { include: { user: { select: { name: true } } } }, disposition: true }
    });
    res.json(calls);
  });

  app.post('/api/calls/outbound', authenticateToken, async (req: any, res) => {
    const { phoneNumber, clientId } = req.body;
    
    const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
    if (!agent) return res.status(400).json({ error: 'Agent not found' });

    const call = await prisma.call.create({
      data: {
        direction: 'OUTBOUND',
        status: 'DIALING',
        phoneNumber,
        clientId,
        agentId: agent.id
      },
      include: { client: true }
    });

    io.to(`user_${req.user.userId}`).emit('call_started', call);
    io.to('admins').emit('call_created', call);

    // Simulate call connection after 3 seconds
    setTimeout(async () => {
      const connectedCall = await prisma.call.update({
        where: { id: call.id },
        data: { status: 'CONNECTED' },
        include: { client: true }
      });
      io.to(`user_${req.user.userId}`).emit('call_connected', connectedCall);
      io.to('admins').emit('call_updated', connectedCall);
    }, 3000);

    res.json(call);
  });

  app.post('/api/calls/inbound', async (req, res) => {
    // Simulate inbound call from external telephony provider
    const { phoneNumber } = req.body;
    
    // Find a client if exists
    const client = await prisma.client.findUnique({ where: { phone: phoneNumber } });
    
    // Find an available agent (simple routing)
    const availableAgent = await prisma.agent.findFirst({
      where: { status: 'ONLINE' },
      include: { user: true }
    });

    const call = await prisma.call.create({
      data: {
        direction: 'INBOUND',
        status: 'RINGING',
        phoneNumber,
        clientId: client?.id,
        agentId: availableAgent?.id
      },
      include: { client: true, agent: { include: { user: { select: { name: true } } } } }
    });

    if (availableAgent) {
      io.to(`user_${availableAgent.userId}`).emit('incoming_call', call);
    }
    io.to('admins').emit('call_created', call);

    res.json(call);
  });

  app.post('/api/calls/:id/answer', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const call = await prisma.call.update({
        where: { id },
        data: { status: 'CONNECTED' },
        include: { client: true }
      });
      io.emit('call_updated', call);
      res.json(call);
    } catch (error) {
      console.error('Error answering call:', error);
      res.status(400).json({ error: 'Failed to answer call' });
    }
  });

  app.post('/api/calls/:id/reject', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const call = await prisma.call.update({
        where: { id },
        data: { status: 'REJECTED', endedAt: new Date() },
        include: { client: true }
      });
      io.emit('call_updated', call);
      res.json(call);
    } catch (error) {
      console.error('Error rejecting call:', error);
      res.status(400).json({ error: 'Failed to reject call' });
    }
  });

  app.post('/api/calls/:id/hangup', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const existingCall = await prisma.call.findUnique({ where: { id } });
      if (!existingCall) return res.status(404).json({ error: 'Call not found' });
      
      const duration = existingCall.startedAt ? Math.floor((new Date().getTime() - existingCall.startedAt.getTime()) / 1000) : 0;

      // Check for auto-recording setting
      const autoRecordSetting = await prisma.systemSetting.findUnique({ where: { key: 'auto_record' } });
      const isAutoRecordEnabled = autoRecordSetting?.value === 'true';
      
      const recordingUrl = isAutoRecordEnabled 
        ? `https://storage.googleapis.com/my-advocate-recordings/call_${id}.mp3` 
        : null;

      const call = await prisma.call.update({
        where: { id },
        data: { 
          status: 'ENDED', 
          endedAt: new Date(), 
          duration,
          recordingUrl: recordingUrl || existingCall.recordingUrl
        },
        include: { client: true }
      });
      io.emit('call_updated', call);
      fireWebhooks('call_ended', call);
      res.json(call);
    } catch (error) {
      console.error('Error hanging up call:', error);
      res.status(400).json({ error: 'Failed to hang up call' });
    }
  });

  // Call Disposition
  app.post('/api/calls/:id/disposition', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { outcome, notes, nextFollowUpAt, stageAfterCall } = req.body;

      const call = await prisma.call.findUnique({ where: { id } });
      if (!call || !call.clientId) return res.status(400).json({ error: 'Call or Client not found' });

      const agent = await prisma.agent.findUnique({ where: { userId: req.user.userId } });
      if (!agent) return res.status(400).json({ error: 'Agent not found' });

      const disposition = await prisma.callDisposition.upsert({
        where: { callId: id },
        update: {
          outcome,
          notes,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
          stageAfterCall
        },
        create: {
          callId: id,
          clientId: call.clientId,
          agentId: agent.id,
          outcome,
          notes,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
          stageAfterCall
        }
      });

      if (stageAfterCall || nextFollowUpAt) {
        await prisma.client.update({
          where: { id: call.clientId },
          data: {
            ...(stageAfterCall && { stage: stageAfterCall }),
            ...(nextFollowUpAt && { nextFollowUpAt: new Date(nextFollowUpAt) }),
            lastContactedAt: new Date()
          }
        });
      }

      io.emit('disposition_saved', disposition);
      res.json(disposition);
    } catch (error) {
      console.error('Error saving disposition:', error);
      res.status(500).json({ error: 'Failed to save disposition' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
