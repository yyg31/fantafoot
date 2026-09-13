import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RankingPage({ searchParams }: { searchParams: { md?: string } }) {
  const matchdays = await prisma.matchday.findMany({ orderBy: { number: "asc" } });
  const finalizedCount = matchdays.filter((m) => m.finalized).length;

  const selectedNumber = searchParams.md ? Number(searchParams.md) : null;
  const selectedMatchday = selectedNumber
    ? matchdays.find((m) => m.number === selectedNumber)
    : null;

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: {
      matchdayScores: selectedMatchday
        ? { where: { matchdayId: selectedMatchday.id } }
        : true,
    },
  });

  const ranking = members
    .map((m) => ({
      id: m.id,
      clubName: m.clubName,
      total: m.matchdayScores.reduce((sum, s) => sum + s.points, 0),
      played: m.matchdayScores.length,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Classement</h1>
        <p className="text-sm text-slate-500">{finalizedCount} journee(s) finalisee(s) sur 34.</p>
      </div>

      <div className="card">
        <p className="mb-2 text-sm font-medium text-slate-600">Vue :</p>
        <div className="flex flex-wrap gap-1">
          <Link
            href="/ranking"
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              !selectedMatchday ? "bg-pitch text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Total saison
          </Link>
          {matchdays.map((m) => (
            <Link
              key={m.id}
              href={`/ranking?md=${m.number}`}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                selectedMatchday?.number === m.number
                  ? "bg-pitch text-white"
                  : m.finalized
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400"
              }`}
            >
              J{m.number}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Club</th>
              {selectedMatchday ? (
                <th>Points (J{selectedMatchday.number})</th>
              ) : (
                <>
                  <th>Journees jouees</th>
                  <th>Total points</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.id}>
                <td className="font-bold">{i + 1}</td>
                <td className="font-medium">{r.clubName}</td>
                {selectedMatchday ? (
                  <td className="font-semibold">{r.total}</td>
                ) : (
                  <>
                    <td>{r.played}</td>
                    <td className="font-semibold">{r.total}</td>
                  </>
                )}
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={selectedMatchday ? 3 : 4} className="text-center text-slate-500">
                  Aucun membre inscrit pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
