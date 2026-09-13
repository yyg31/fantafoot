import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-3xl font-bold text-pitch">Bienvenue sur Fantafoot</h1>
        <p className="text-slate-600">
          Le jeu de fantasy football base sur le championnat de France de Ligue 1. Constituez un
          effectif de 22 joueurs avec un budget de 220 M€, alignez chaque journee vos 11 titulaires
          (1 gardien, 4 defenseurs, 3 milieux, 3 attaquants) et grimpez au classement general sur
          les 34 journees de la saison.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/register" className="btn">
            Creer mon club
          </Link>
          <Link href="/login" className="btn-secondary">
            Connexion
          </Link>
          <Link href="/players" className="btn-secondary">
            Voir les joueurs
          </Link>
        </div>
      </div>
    );
  }

  const [squadCount, lock, scores, matchdays] = await Promise.all([
    prisma.squadPlayer.count({ where: { userId: user.id } }),
    prisma.squadLock.findUnique({ where: { userId: user.id } }),
    prisma.clubMatchdayScore.findMany({ where: { userId: user.id }, orderBy: { matchday: { number: "desc" } }, take: 1, include: { matchday: true } }),
    prisma.matchday.findMany({ orderBy: { number: "asc" } }),
  ]);

  const spent = lock
    ? (await prisma.squadPlayer.aggregate({ where: { userId: user.id }, _sum: { purchasePrice: true } }))._sum
        .purchasePrice ?? 0
    : 0;

  const now = new Date();
  const nextMatchday = matchdays.find((m) => !m.finalized && new Date(m.deadline) >= now);
  const lastScore = scores[0];

  const allMembersCount = await prisma.user.count({ where: { role: "MEMBER" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonjour, {user.clubName} 👋</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Effectif</p>
          {lock ? (
            <p className="text-lg font-semibold text-green-700">Verrouille (22 joueurs)</p>
          ) : (
            <p className="text-lg font-semibold text-amber-700">{squadCount} / 22 en cours</p>
          )}
          {lock && <p className="text-sm text-slate-500">Depense : {spent.toFixed(1)} / {user.budget} M€</p>}
          <Link href="/squad" className="mt-2 inline-block text-sm text-pitch underline">
            Gerer mon effectif
          </Link>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Prochaine journee</p>
          {nextMatchday ? (
            <>
              <p className="text-lg font-semibold">Journee {nextMatchday.number}</p>
              <p className="text-sm text-slate-500">
                Date limite : {new Date(nextMatchday.deadline).toLocaleString("fr-FR")}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Saison terminee ou calendrier non publie.</p>
          )}
          <Link href="/lineup" className="mt-2 inline-block text-sm text-pitch underline">
            Composer mon equipe
          </Link>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Derniere journee jouee</p>
          {lastScore ? (
            <p className="text-lg font-semibold">
              J{lastScore.matchday.number} : {lastScore.points} pts
            </p>
          ) : (
            <p className="text-sm text-slate-500">Aucune journee finalisee pour l&apos;instant.</p>
          )}
          <Link href="/ranking" className="mt-2 inline-block text-sm text-pitch underline">
            Voir le classement ({allMembersCount} clubs)
          </Link>
        </div>
      </div>
    </div>
  );
}
