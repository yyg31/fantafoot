"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { SQUAD_SIZE } from "@/lib/constants";
import type { ActionState } from "@/lib/action-state";

export async function addPlayerToSquad(playerId: string): Promise<ActionState> {
  const user = await requireUser();

  const lock = await prisma.squadLock.findUnique({ where: { userId: user.id } });
  if (lock) return { error: "Votre effectif est deja verrouille definitivement." };

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || !player.active) return { error: "Joueur introuvable." };

  const squad = await prisma.squadPlayer.findMany({ where: { userId: user.id } });
  if (squad.some((s) => s.playerId === playerId)) {
    return { error: "Ce joueur est deja dans votre effectif." };
  }
  if (squad.length >= SQUAD_SIZE) {
    return { error: `Votre effectif compte deja ${SQUAD_SIZE} joueurs.` };
  }

  const spent = squad.reduce((sum, s) => sum + s.purchasePrice, 0);
  if (spent + player.currentValue > user.budget) {
    return { error: "Budget insuffisant pour acheter ce joueur." };
  }

  await prisma.squadPlayer.create({
    data: { userId: user.id, playerId, purchasePrice: player.currentValue },
  });

  revalidatePath("/squad");
  return { success: `${player.name} ajoute a votre effectif.` };
}

export async function removePlayerFromSquad(playerId: string): Promise<ActionState> {
  const user = await requireUser();

  const lock = await prisma.squadLock.findUnique({ where: { userId: user.id } });
  if (lock) return { error: "Votre effectif est deja verrouille definitivement." };

  await prisma.squadPlayer.deleteMany({ where: { userId: user.id, playerId } });

  revalidatePath("/squad");
  return { success: "Joueur retire de votre effectif." };
}

export async function lockSquad(): Promise<ActionState> {
  const user = await requireUser();

  const lock = await prisma.squadLock.findUnique({ where: { userId: user.id } });
  if (lock) return { error: "Votre effectif est deja verrouille." };

  const count = await prisma.squadPlayer.count({ where: { userId: user.id } });
  if (count !== SQUAD_SIZE) {
    return { error: `Vous devez selectionner exactement ${SQUAD_SIZE} joueurs (actuellement ${count}).` };
  }

  await prisma.squadLock.create({ data: { userId: user.id } });

  revalidatePath("/squad");
  revalidatePath("/lineup");
  return { success: "Effectif verrouille definitivement pour la saison !" };
}
