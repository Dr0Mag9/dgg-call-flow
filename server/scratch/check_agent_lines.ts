import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAgentConfig() {
  const agents = await prisma.agent.findMany({
    include: { 
      user: true,
      telephonyLine: true
    }
  });
  
  console.log('--- AGENT & LINE CONFIGURATION ---');
  agents.forEach(a => {
    console.log(`Agent: ${a.user.name} (${a.user.email})`);
    console.log(`  Extension: ${a.extension}`);
    console.log(`  SIP Password Set: ${!!a.sipPassword}`);
    console.log(`  Line Assigned: ${a.telephonyLine?.number || 'NONE'}`);
    console.log('-------------------');
  });
}

checkAgentConfig().finally(() => prisma.$disconnect());
