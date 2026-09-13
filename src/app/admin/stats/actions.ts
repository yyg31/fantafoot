"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { computePlayerMatchdayPoints, type RawStat } from "@/lib/points";
import { computeCurrentValue } from "@/lib/value";
import { resolveEffectiveLineup } from "@/lib/lineup-fallback";
import type { ActionState } from "@/lib/action-state";
import type { Position } from "@/lib/constants";

export async function saveTeamResults(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const matchdayId = String(formData.get("matchdayId") || "");
  const matchday = await prisma.matchday.findUnique({ where: { id: matchdayId } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Cette journee est deja finalisee." };

  const clubs = JSON.parse(String(formData.get("clubs") || "[]")) as string[];

  for (const club of clubs) {
    const raw = formData.get(`gc_${club}`);
    if (raw === null || raw === "") continue;
    const goalsConceded = Number(raw);
    if (!Number.isFinite(goalsConceded) || goalsConceded < 0) continue;

    await prisma.teamMatchdayResult.upsert({
      where: { l1Club_matchdayId: { l1Club: club, matchdayId } },
      update: { goalsConceded },
      create: { l1Club: club, matchdayId, goalsConceded },
    });
  }

  revalidatePath("/admin/stats");
  return { success: "Resultats d'equipe enregistres." };
}

export async function upsertPlayerStat(formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const matchdayId = String(formData.get("matchdayId") || "");
  const playerId = String(formData.get("playerId") || "");

  const matchday = await prisma.matchday.findUnique({ where: { id: matchdayId } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Cette journee est deja finalisee." };

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { error: "Joueur introuvable." };

  const num = (name: string) => {
    const v = Number(formData.get(name) || 0);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };

  const goalsConcededRaw = formData.get("goalsConceded");
  const goalsConceded =
    goalsConcededRaw === null || goalsConcededRaw === ""
      ? null
      : Math.max(0, Number(goalsConcededRaw) || 0);

  await prisma.playerMatchdayStat.upsert({
    where: { playerId_matchdayId: { playerId, matchdayId } },
    update: {
      goals: num("goals"),
      penaltyGoals: num("penaltyGoals"),
      assists: num("assists"),
      yellowCards: num("yellowCards"),
      redCards: num("redCards"),
      goalsConceded,
    },
    create: {
      playerId,
      matchdayId,
      goals: num("goals"),
      penaltyGoals: num("penaltyGoals"),
      assists: num("assists"),
      yellowCards: num("yellowCards"),
      redCards: num("redCards"),
      goalsConceded,
    },
  });

  revalidatePath("/admin/stats");
  return { success: `Stats de ${player.name} enregistrees.` };
}

export async function deletePlayerStat(formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const matchdayId = String(formData.get("matchdayId") || "");
  const playerId = String(formData.get("playerId") || "");

  const matchday = await prisma.matchday.findUnique({ where: { id: matchdayId } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Cette journee est deja finalisee." };

  await prisma.playerMatchdayStat.deleteMany({ where: { matchdayId, playerId } });

  revalidatePath("/admin/stats");
  return { success: "Stats du joueur reinitialisees a zero." };
}

/**
 * Finalise une journee :
 *  1. calcule les points de chaque joueur actif (stats saisies + clean-sheet/malus
 *     derives du resultat d'equipe) et les fige,
 *  2. met a jour le total de points et la valeur actualisee de chaque joueur,
 *  3. materialise, pour chaque membre sans composition saisie, la composition
 *     par defaut (celle de la derniere journee jouee),
 *  4. calcule le score de chaque club pour la journee.
 */
export async function finalizeMatchday(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const matchdayId = String(formData.get("matchdayId") || "");
  const matchday = await prisma.matchday.findUnique({ where: { id: matchdayId } });
  if (!matchday) return { error: "Journee introuvable." };
  if (matchday.finalized) return { error: "Cette journee est deja finalisee." };

  await prisma.$transaction(
    async (tx) => {
      const teamResults = await tx.teamMatchdayResult.findMany({ where: { matchdayId } });
      const teamGoalsConceded = new Map(teamResults.map((t) => [t.l1Club, t.goalsConceded]));

      const players = await tx.player.findMany({ where: { active: true } });
      const existingStats = await tx.playerMatchdayStat.findMany({ where: { matchdayId } });
      const statByPlayer = new Map(existingStats.map((s) => [s.playerId, s]));

      const completedMatchdays = (await tx.matchday.count({ where: { finalized: true } })) + 1;

      const pointsByPlayer = new Map<string, number>();

      for (const player of players) {
        const existing = statByPlayer.get(player.id);
        const raw: RawStat = existing
          ? {
              goals: existing.goals,
              penaltyGoals: existing.penaltyGoals,
              assists: existing.assists,
              yellowCards: existing.yellowCards,
              redCards: existing.redCards,
              goalsConceded: existing.goalsConceded,
            }
          : { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0, goalsConceded: null };

        const teamGC = teamGoalsConceded.get(player.l1Club) ?? null;
        const points = computePlayerMatchdayPoints(player.position as Position, raw, teamGC);
        pointsByPlayer.set(player.id, points);

        if (existing) {
          await tx.playerMatchdayStat.update({ where: { id: existing.id }, data: { points } });
        } else {
          await tx.playerMatchdayStat.create({
            data: { playerId: player.id, matchdayId, ...raw, goalsConceded: raw.goalsConceded ?? null, points },
          });
        }

        const newTotalPoints = player.totalPoints + points;
        const newValue = computeCurrentValue(newTotalPoints, player.startValue, completedMatchdays);
        await tx.player.update({
          where: { id: player.id },
          data: { totalPoints: newTotalPoints, currentValue: newValue },
        });
      }

      const members = await tx.user.findMany({ where: { role: "MEMBER" } });
      for (const member of members) {
        let lineup = await tx.lineup.findUnique({
          where: { userId_matchdayId: { userId: member.id, matchdayId } },
          include: { slots: true },
        });

        if (!lineup) {
          const effective = await resolveEffectiveLineup(member.id, matchday.number);
          if (effective.playerIds.length === 11) {
            lineup = await tx.lineup.create({
              data: {
                userId: member.id,
                matchdayId,
                auto: true,
                slots: { create: effective.playerIds.map((playerId) => ({ playerId, matchdayId })) },
              },
              include: { slots: true },
            });
          }
        }

        const score = (lineup?.slots ?? []).reduce(
          (sum, slot) => sum + (pointsByPlayer.get(slot.playerId) ?? 0),
          0
        );

        await tx.clubMatchdayScore.upsert({
          where: { userId_matchdayId: { userId: member.id, matchdayId } },
          update: { points: score },
          create: { userId: member.id, matchdayId, points: score },
        });
      }

      await tx.matchday.update({
        where: { id: matchdayId },
        data: { finalized: true, finalizedAt: new Date() },
      });
    },
    { timeout: 60000 }
  );

  revalidatePath("/admin/stats");
  revalidatePath("/admin/matchdays");
  revalidatePath("/players");
  revalidatePath("/ranking");
  revalidatePath("/lineup");

  return { success: `Journee ${matchday.number} finalisee : points et valeurs mis a jour.` };
}
