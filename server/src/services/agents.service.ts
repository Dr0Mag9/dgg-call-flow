import { prisma } from '../config/prisma.js';

export async function getAgentForUser(userId: string) {
  return prisma.agent.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true, isActive: true } },
    },
  });
}
