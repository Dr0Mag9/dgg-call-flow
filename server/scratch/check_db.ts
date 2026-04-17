import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSettings() {
  const settings = await prisma.systemSetting.findMany();
  console.log('--- SYSTEM SETTINGS ---');
  console.log(JSON.stringify(settings, null, 2));
  
  const agents = await prisma.agent.findMany({
    include: { user: true }
  });
  console.log('\n--- AGENTS ---');
  console.log(JSON.stringify(agents.map(a => ({
    name: a.user.name,
    extension: a.extension,
    hasSipPassword: !!a.sipPassword
  })), null, 2));
}

checkSettings().finally(() => prisma.$disconnect());
