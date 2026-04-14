import { prisma } from '../config/prisma.js';
import { signToken } from '../utils/jwt.js';
import { verifyPassword } from '../utils/password.js';

export type LoginResult =
  | { ok: false; error: string }
  | {
      ok: true;
      token: string;
      user: { id: string; name: string; email: string; role: string };
    };

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return { ok: false, error: 'Invalid credentials' };
  }
  if (!user.isActive) {
    return { ok: false, error: 'Account is disabled' };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: 'Invalid credentials' };
  }

  const token = signToken({ userId: user.id, role: user.role });
  return {
    ok: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isActive: true,
      agent: true,
    },
  });
}
