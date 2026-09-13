// SQLite (utilise en developpement) ne supporte pas les enums natifs Prisma.
// On modelise donc Role et Position comme de simples chaines contraintes,
// ce qui reste compatible avec un passage ulterieur en PostgreSQL.

export const ROLES = ["MEMBER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const SQUAD_SIZE = 22;

/** Nombre maximum de joueurs par poste dans l'effectif de 22 (le total fait bien 22). */
export const SQUAD_POSITION_LIMITS: Record<"GK" | "DEF" | "MID" | "FWD", number> = {
  GK: 3,
  DEF: 7,
  MID: 7,
  FWD: 5,
};

export const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type Position = (typeof POSITIONS)[number];

export function isPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Gardien",
  DEF: "Defenseur",
  MID: "Milieu",
  FWD: "Attaquant",
};

/** Comme les positions viennent de la base sous forme de String (voir plus haut), ce helper
 * accepte n'importe quelle chaine (au lieu du seul type Position) pour l'affichage. */
export function positionLabel(position: string): string {
  return POSITION_LABELS[position as Position] ?? position;
}
