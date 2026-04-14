import { prisma } from '../config/prisma.js';

export function listGlobalMaterials() {
  return prisma.studyMaterial.findMany({
    where: { active: true, clientId: null },
    orderBy: { title: 'asc' },
  });
}
