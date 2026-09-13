"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Position, isPosition } from "@/lib/constants";
import type { ActionState } from "@/lib/action-state";

export async function createPlayer(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "");
  const l1Club = String(formData.get("l1Club") || "").trim();
  const startValue = Number(formData.get("startValue"));

  if (!name || !l1Club || !isPosition(position) || !Number.isFinite(startValue) || startValue <= 0) {
    return { error: "Merci de renseigner tous les champs correctement." };
  }

  await prisma.player.create({
    data: {
      name,
      position: position as Position,
      l1Club,
      startValue,
      currentValue: startValue,
    },
  });

  revalidatePath("/admin/players");
  revalidatePath("/players");
  return { success: `${name} ajoute a la base.` };
}

export async function updatePlayer(formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "");
  const l1Club = String(formData.get("l1Club") || "").trim();
  const startValue = Number(formData.get("startValue"));
  const active = formData.get("active") === "on";

  if (!id || !name || !l1Club || !isPosition(position) || !Number.isFinite(startValue) || startValue <= 0) {
    return { error: "Merci de renseigner tous les champs correctement." };
  }

  await prisma.player.update({
    where: { id },
    data: { name, position: position as Position, l1Club, startValue, active },
  });

  revalidatePath("/admin/players");
  revalidatePath("/players");
  return { success: "Joueur mis a jour." };
}

/**
 * Import en masse. Une ligne par joueur, format :
 *   Nom;Poste(GK|DEF|MID|FWD);Club L1;Valeur de depart en M€
 * Les lignes vides ou commencant par # sont ignorees. Un joueur du meme nom
 * dans le meme club L1 est mis a jour plutot que duplique.
 */
export async function importPlayersCsv(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const raw = String(formData.get("csv") || "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [i, line] of lines.entries()) {
    const parts = line.split(";").map((p) => p.trim());
    if (parts.length < 4) {
      errors.push(`Ligne ${i + 1}: format invalide ("${line}")`);
      continue;
    }
    const [name, positionRaw, l1Club, startValueRaw] = parts;
    const position = positionRaw.toUpperCase();
    const startValue = Number(startValueRaw.replace(",", "."));

    if (!name || !l1Club || !isPosition(position) || !Number.isFinite(startValue) || startValue <= 0) {
      errors.push(`Ligne ${i + 1}: donnees invalides ("${line}")`);
      continue;
    }

    const existing = await prisma.player.findFirst({ where: { name, l1Club } });
    if (existing) {
      await prisma.player.update({
        where: { id: existing.id },
        data: { position: position as Position, startValue },
      });
      updated++;
    } else {
      await prisma.player.create({
        data: {
          name,
          position: position as Position,
          l1Club,
          startValue,
          currentValue: startValue,
        },
      });
      created++;
    }
  }

  revalidatePath("/admin/players");
  revalidatePath("/players");

  if (errors.length > 0) {
    return {
      error: `${created} crees, ${updated} mis a jour. Erreurs: ${errors.slice(0, 5).join(" | ")}${errors.length > 5 ? "..." : ""}`,
    };
  }
  return { success: `Import termine : ${created} joueurs crees, ${updated} mis a jour.` };
}
