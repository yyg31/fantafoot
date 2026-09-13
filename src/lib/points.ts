import { Position } from "@/lib/constants";

export type RawStat = {
  goals: number;
  penaltyGoals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  /** Buts encaisses par le gardien sur cette journee, si connu individuellement. */
  goalsConceded?: number | null;
};

/**
 * Bareme officiel Fantafoot :
 *  - passe decisive: +1
 *  - but: +3 (attaquant/milieu/gardien) ou +4 si le buteur est defenseur
 *  - but sur penalty: +1 en plus du but lui-meme
 *  - carton jaune: -0.5
 *  - carton rouge: -2
 *  - gardien ayant encaisse plus de 3 buts: -1
 *  - clean sheet gardien: +2
 *  - clean sheet defenseur: +1
 *
 * `goalsConceded` doit etre resolu au prealable (stat individuelle du gardien si
 * saisie, sinon resultat d'equipe de la journee). null/undefined = inconnu, aucun
 * bonus/malus de clean-sheet applique.
 */
export function computePlayerMatchdayPoints(
  position: Position,
  stat: RawStat,
  goalsConceded: number | null | undefined
): number {
  const goalValue = position === "DEF" ? 4 : 3;

  let points = 0;
  points += stat.goals * goalValue;
  points += stat.penaltyGoals * 1;
  points += stat.assists * 1;
  points -= stat.yellowCards * 0.5;
  points -= stat.redCards * 2;

  const conceded = stat.goalsConceded ?? goalsConceded;
  if (conceded !== null && conceded !== undefined) {
    if (position === "GK") {
      if (conceded > 3) points -= 1;
      if (conceded === 0) points += 2;
    } else if (position === "DEF") {
      if (conceded === 0) points += 1;
    }
  }

  return roundToHalf(points);
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
