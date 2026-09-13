import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [memberCount, playerCount, matchdayCount, finalizedCount, lockedSquads] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.player.count({ where: { active: true } }),
      prisma.matchday.count(),
      prisma.matchday.count({ where: { finalized: true } }),
      prisma.squadLock.count(),
    ]);

  const stats = [
    { label: "Membres inscrits", value: memberCount },
    { label: "Joueurs actifs en base", value: playerCount },
    { label: "Effectifs verrouilles", value: lockedSquads },
    { label: "Journees creees", value: matchdayCount },
    { label: "Journees finalisees", value: `${finalizedCount} / ${matchdayCount || 34}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <p className="text-sm text-slate-500">{s.label}</p>
          <p className="text-2xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
