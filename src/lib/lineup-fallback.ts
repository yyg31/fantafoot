import { prisma } from "@/lib/prisma";

/**
 * Retourne les identifiants des 11 joueurs qui s'appliqueront pour un membre a
 * une journee donnee : sa composition saisie pour cette journee si elle
 * existe, sinon la derniere composition saisie lors d'une journee anterieure
 * (regle : "a defaut, l'equipe de la journee precedente s'applique").
 */
export async function resolveEffectiveLineup(
  userId: string,
  matchdayNumber: number
): Promise<{ playerIds: string[]; sourceMatchdayNumber: number | null; isAuto: boolean }> {
  const lineup = await prisma.lineup.findFirst({
    where: { userId, matchday: { number: matchdayNumber } },
    include: { slots: true },
  });
  if (lineup) {
    return {
      playerIds: lineup.slots.map((s) => s.playerId),
      sourceMatchdayNumber: matchdayNumber,
      isAuto: lineup.auto,
    };
  }

  const previous = await prisma.lineup.findFirst({
    where: { userId, matchday: { number: { lt: matchdayNumber } } },
    include: { slots: true },
    orderBy: { matchday: { number: "desc" } },
  });
  if (previous) {
    return {
      playerIds: previous.slots.map((s) => s.playerId),
      sourceMatchdayNumber: previous.matchdayId ? (await prisma.matchday.findUnique({ where: { id: previous.matchdayId } }))!.number : null,
      isAuto: true,
    };
  }

  return { playerIds: [], sourceMatchdayNumber: null, isAuto: true };
}
