import { describe, expect, it } from "vitest";
import { computePlayerMatchdayPoints } from "./points";

describe("computePlayerMatchdayPoints", () => {
  it("attaquant : but + passe D + jaune", () => {
    const points = computePlayerMatchdayPoints(
      "FWD",
      { goals: 1, penaltyGoals: 0, assists: 1, yellowCards: 1, redCards: 0 },
      null
    );
    // 3 (but) + 1 (passe D) - 0.5 (jaune) = 3.5
    expect(points).toBe(3.5);
  });

  it("defenseur marque : bareme a 4 points au lieu de 3", () => {
    const points = computePlayerMatchdayPoints(
      "DEF",
      { goals: 1, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      3
    );
    expect(points).toBe(4);
  });

  it("but sur penalty : bonus de 1 point en plus du but", () => {
    const points = computePlayerMatchdayPoints(
      "FWD",
      { goals: 1, penaltyGoals: 1, assists: 0, yellowCards: 0, redCards: 0 },
      null
    );
    // 3 (but) + 1 (penalty) = 4
    expect(points).toBe(4);
  });

  it("carton rouge : -2", () => {
    const points = computePlayerMatchdayPoints(
      "MID",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 1 },
      null
    );
    expect(points).toBe(-2);
  });

  it("gardien clean sheet : +2", () => {
    const points = computePlayerMatchdayPoints(
      "GK",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      0
    );
    expect(points).toBe(2);
  });

  it("gardien encaisse plus de 3 buts : -1", () => {
    const points = computePlayerMatchdayPoints(
      "GK",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      4
    );
    expect(points).toBe(-1);
  });

  it("gardien encaisse exactement 3 buts : ni bonus ni malus", () => {
    const points = computePlayerMatchdayPoints(
      "GK",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      3
    );
    expect(points).toBe(0);
  });

  it("defenseur clean sheet : +1", () => {
    const points = computePlayerMatchdayPoints(
      "DEF",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      0
    );
    expect(points).toBe(1);
  });

  it("milieu clean sheet : pas de bonus (reserve gardien/defenseur)", () => {
    const points = computePlayerMatchdayPoints(
      "MID",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      0
    );
    expect(points).toBe(0);
  });

  it("goalsConceded inconnu (null) : aucun bonus/malus applique", () => {
    const points = computePlayerMatchdayPoints(
      "GK",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0 },
      null
    );
    expect(points).toBe(0);
  });

  it("stat individuelle du gardien prioritaire sur le resultat d'equipe", () => {
    // Le gardien titulaire a encaisse 2 buts avant sa sortie, l'equipe en encaisse 4 au total.
    const points = computePlayerMatchdayPoints(
      "GK",
      { goals: 0, penaltyGoals: 0, assists: 0, yellowCards: 0, redCards: 0, goalsConceded: 2 },
      4
    );
    expect(points).toBe(0);
  });
});
