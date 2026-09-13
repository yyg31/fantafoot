import { describe, expect, it } from "vitest";
import { computeCurrentValue } from "./value";

describe("computeCurrentValue", () => {
  it("avant le debut de la saison (x=0) : valeur = valeur de depart", () => {
    expect(computeCurrentValue(0, 20, 0)).toBe(20);
  });

  it("a la fin de la saison (x=34) : valeur = points cumules", () => {
    expect(computeCurrentValue(50, 20, 34)).toBe(50);
  });

  it("a mi-saison : moyenne ponderee entre points et valeur de depart", () => {
    // points=68, depart=20, x=17 -> 68*(17/34) + 20*(17/34) = 34 + 10 = 44
    expect(computeCurrentValue(68, 20, 17)).toBe(44);
  });

  it("arrondi toujours au superieur", () => {
    // points=1, depart=10, x=1 -> 1*(1/34) + 10*(33/34) = 0.0294 + 9.7058... = 9.7352...
    const value = computeCurrentValue(1, 10, 1);
    expect(value).toBeGreaterThanOrEqual(9.8);
    expect(Number.isInteger(value * 10)).toBe(true); // arrondi au dixieme
  });
});
