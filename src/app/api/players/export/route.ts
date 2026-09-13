import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: [{ l1Club: "asc" }, { name: "asc" }],
  });

  const header = ["Nom", "Poste", "Club L1", "Valeur depart", "Valeur actuelle", "Points", "Actif"];
  const rows = players.map((p) => [
    p.name,
    p.position,
    p.l1Club,
    p.startValue,
    p.currentValue,
    p.totalPoints,
    p.active ? "oui" : "non",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="joueurs.csv"',
    },
  });
}
