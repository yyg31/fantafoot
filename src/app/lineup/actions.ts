"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";

const REQUIRED_COUNTS: Record<string, number> = { GK: 1, DEF: 4, MID: 3, FWD: 3 };

export async function submitLineup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const matchdayId = String(formData.get("matchdayId") || "");
  const playerIds = formData.getAll("playerIds").map(String);

  const lock = await prisma.squadLock.findUnique({ where: { userId: user.id } });
  if (!lock) return { error: "Vous devez d'abord verrouiller votre effectif de 22 joueurs." };

  const matchday = await prisma.matchday.findUnique({ where: { id: matchdayId } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Cette journee est deja finalisee." };
  if (new Date() > new Date(matchday.deadline)) {
    return { error: "La date limite de cette journee est depassee." };
  }

  if (new Set(playerIds).size !== playerIds.length) {
    return { error: "Un joueur ne peut apparaitre qu'une seule fois dans la composition." };
  }
  if (playerIds.length !== 11) {
    return { error: "Vous devez selectionner exactement 11 joueurs." };
  }

  const squad = await prisma.squadPlayer.findMany({
    where: { userId: user.id, playerId: { in: playerIds } },
    include: { player: true },
  });
  if (squad.length !== playerIds.length) {
    return { error: "Vous ne pouvez selectionner que des joueurs de votre effectif." };
  }

  const counts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const s of squad) counts[s.player.position]++;
  for (const [pos, required] of Object.entries(REQUIRED_COUNTS)) {
    if (counts[pos] !== required) {
      return {
        error: `Composition invalide : il faut exactement ${required} ${posLabel(pos)} (actuellement ${counts[pos]}).`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.lineup.findUnique({ where: { userId_matchdayId: { userId: user.id, matchdayId } } });
    if (existing) {
      await tx.lineupSlot.deleteMany({ where: { lineupId: existing.id } });
      await tx.lineup.update({
        where: { id: existing.id },
        data: {
          auto: false,
          submittedAt: new Date(),
          slots: { create: playerIds.map((playerId) => ({ playerId, matchdayId })) },
        },
      });
    } else {
      await tx.lineup.create({
        data: {
          userId: user.id,
          matchdayId,
          auto: false,
          slots: { create: playerIds.map((playerId) => ({ playerId, matchdayId })) },
        },
      });
    }
  });

  revalidatePath("/lineup");
  return { success: `Composition enregistree pour la journee ${matchday.number}.` };
}

function posLabel(pos: string) {
  return { GK: "gardien", DEF: "defenseur(s)", MID: "milieu(x)", FWD: "attaquant(s)" }[pos] ?? pos;
}
