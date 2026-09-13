"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";

const TOTAL_MATCHDAYS = 34;

export async function generateSeasonMatchdays(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const startDateRaw = String(formData.get("startDate") || "");
  const intervalDays = Number(formData.get("intervalDays") || 7);
  const startDate = new Date(startDateRaw);

  if (!startDateRaw || Number.isNaN(startDate.getTime())) {
    return { error: "Date de debut invalide." };
  }

  const existing = await prisma.matchday.count();
  if (existing > 0) {
    return { error: "Des journees existent deja. Supprimez-les d'abord si vous voulez regenerer." };
  }

  const data = Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => {
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + i * intervalDays);
    return { number: i + 1, deadline };
  });

  await prisma.matchday.createMany({ data });

  revalidatePath("/admin/matchdays");
  return { success: `${TOTAL_MATCHDAYS} journees creees.` };
}

export async function updateMatchdayDeadline(formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const deadlineRaw = String(formData.get("deadline") || "");
  const deadline = new Date(deadlineRaw);

  if (!id || Number.isNaN(deadline.getTime())) {
    return { error: "Donnees invalides." };
  }

  const matchday = await prisma.matchday.findUnique({ where: { id } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Impossible de modifier une journee finalisee." };

  await prisma.matchday.update({ where: { id }, data: { deadline } });

  revalidatePath("/admin/matchdays");
  return { success: `Date limite de la journee ${matchday.number} mise a jour.` };
}
