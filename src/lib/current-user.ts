import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifie.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Reserve a l'administrateur.");
  return user;
}
