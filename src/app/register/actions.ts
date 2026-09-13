"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { RegisterState } from "@/lib/action-state";

export async function registerMember(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const clubName = String(formData.get("clubName") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (!email || !clubName || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Adresse email invalide." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un membre existe deja avec cet email." };
  }

  const existingClub = await prisma.user.findFirst({ where: { clubName } });
  if (existingClub) {
    return { error: "Ce nom de club est deja pris." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, clubName, passwordHash, budget: 220 },
  });

  return { success: true };
}
