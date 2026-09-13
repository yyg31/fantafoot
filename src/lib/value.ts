const TOTAL_MATCHDAYS = 34;

/**
 * Valeur actualisee d'un joueur :
 *   valeur = arrondi_superieur( points * x/34 + valeur_depart * (34-x)/34 )
 * ou x = nombre de journees deja terminees (finalisees) et `points` le total
 * de points cumules par le joueur sur la saison.
 */
export function computeCurrentValue(
  totalPoints: number,
  startValue: number,
  completedMatchdays: number
): number {
  const x = Math.min(Math.max(completedMatchdays, 0), TOTAL_MATCHDAYS);
  const raw =
    totalPoints * (x / TOTAL_MATCHDAYS) +
    startValue * ((TOTAL_MATCHDAYS - x) / TOTAL_MATCHDAYS);
  // Arrondi au superieur, au dixieme de million pres.
  return Math.ceil(raw * 10) / 10;
}
