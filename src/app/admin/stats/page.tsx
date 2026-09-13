import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamResultsForm from "@/components/admin/TeamResultsForm";
import StatsTable from "@/components/admin/StatsTable";
import FinalizeButton from "@/components/admin/FinalizeButton";
import type { Position } from "@/lib/constants";

export default async function AdminStatsPage({ searchParams }: { searchParams: { md?: string } }) {
  const matchdays = await prisma.matchday.findMany({ orderBy: { number: "asc" } });

  if (matchdays.length === 0) {
    return (
      <p>
        Aucune journee n&apos;a encore ete creee.{" "}
        <Link href="/admin/matchdays" className="text-pitch underline">
          Generer le calendrier
        </Link>
        .
      </p>
    );
  }

  const defaultMatchday = matchdays.find((m) => !m.finalized) ?? matchdays[matchdays.length - 1];
  const selectedNumber = searchParams.md ? Number(searchParams.md) : defaultMatchday.number;
  const matchday = matchdays.find((m) => m.number === selectedNumber) ?? defaultMatchday;

  const [clubsRaw, teamResults, players, stats] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      select: { l1Club: true },
      distinct: ["l1Club"],
      orderBy: { l1Club: "asc" },
    }),
    prisma.teamMatchdayResult.findMany({ where: { matchdayId: matchday.id } }),
    prisma.player.findMany({
      where: { active: true },
      orderBy: [{ l1Club: "asc" }, { name: "asc" }],
      select: { id: true, name: true, position: true, l1Club: true },
    }),
    prisma.playerMatchdayStat.findMany({ where: { matchdayId: matchday.id } }),
  ]);

  const clubs = clubsRaw.map((c) => c.l1Club);
  const goalsConcededByClub = Object.fromEntries(teamResults.map((t) => [t.l1Club, t.goalsConceded]));
  const statByPlayerId = new Map(stats.map((s) => [s.playerId, s]));

  const playerRows = players.map((p) => ({
    ...p,
    position: p.position as Position,
    stat: statByPlayerId.get(p.id),
  }));

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="mb-2 text-sm font-medium text-slate-600">Choisir une journee :</p>
        <div className="flex flex-wrap gap-1">
          {matchdays.map((m) => (
            <Link
              key={m.id}
              href={`/admin/stats?md=${m.number}`}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                m.number === matchday.number
                  ? "bg-pitch text-white"
                  : m.finalized
                    ? "bg-slate-100 text-slate-400"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              J{m.number}
            </Link>
          ))}
        </div>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="font-semibold">Journee {matchday.number}</p>
          <p className="text-sm text-slate-500">
            Date limite : {new Date(matchday.deadline).toLocaleString("fr-FR")}
          </p>
        </div>
        {matchday.finalized ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            Finalisee
          </span>
        ) : (
          <FinalizeButton matchdayId={matchday.id} />
        )}
      </div>

      <TeamResultsForm
        matchdayId={matchday.id}
        clubs={clubs}
        goalsConcededByClub={goalsConcededByClub}
        disabled={matchday.finalized}
      />

      <StatsTable matchdayId={matchday.id} players={playerRows} finalized={matchday.finalized} />
    </div>
  );
}
