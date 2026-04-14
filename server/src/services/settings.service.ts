import { prisma } from '../config/prisma.js';

export async function getSystemSettingsMap() {
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
}

export function upsertSystemSetting(key: string, value: unknown) {
  const str = typeof value === 'boolean' ? String(value) : String(value);
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: str },
    create: { key, value: str },
  });
}

export function listWebhooks() {
  return prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
}

export function createWebhook(data: {
  name: string;
  url: string;
  secret?: string;
  events: string;
  isActive?: boolean;
}) {
  return prisma.webhook.create({
    data: {
      name: data.name.trim(),
      url: data.url.trim(),
      secret: data.secret?.trim() || null,
      events: data.events,
      isActive: data.isActive ?? true,
    },
  });
}

export function updateWebhook(
  id: string,
  data: Partial<{ name: string; url: string; secret: string; events: string; isActive: boolean }>,
) {
  return prisma.webhook.update({
    where: { id },
    data,
  });
}

export async function deleteWebhook(id: string) {
  await prisma.webhook.delete({ where: { id } });
}
