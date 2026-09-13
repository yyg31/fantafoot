import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { resolveEffectiveLineup } from "@/lib/lineup-fallback";
import LineupForm from "@/components/lineup/LineupForm";

const POSITION_GROUPS = [
  { position: "GK", label: "Gardien", required: 1 },
  { position: "DEF", label: "Defenseurs", required: 4 },
  { position: "MID", label: "Milieux", required: 3 },
  { position: "FWD", label: "Attaquants", required: 3 },
];

export default async function LineupPage({ searchParams }: { searchParams: { md?: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");

  const lock = await prisma.squadLock.findUnique({ where: { userId: user.id } });
  if (!lock) {
    return (
      <div className="card">
        <p className="mb-3">
          Vous devez d&apos;abord verrouiller votre effectif de 22 joueurs avant de pouvoir
          composer votre equipe de la journee.
        </p>
        <Link href="/squad" className="btn">
          Aller a mon effectif
        </Link>
      </div>
    );
  }

  const matchdays = await prisma.matchday.findMany({ orderBy: { number: "asc" } });
  if (matchdays.length === 0) {
    return <p>Aucune journee n&apos;a encore ete creee par l&apos;administrateur.</p>;
  }

  const now = new Date();
  const defaultMatchday =
    matchdays.find((m) => !m.finalized && new Date(m.deadline) >= now) ??
    matchdays.find((m) => !m.finalized) ??
    matchdays[matchdays.length - 1];

  const selectedNumber = searchParams.md ? Number(searchParams.md) : defaultMatchday.number;
  const matchday = matchdays.find((m) => m.number === selectedNumber) ?? defaultMatchday;

  const squad = await prisma.squadPlayer.findMany({
    where: { userId: user.id },
    include: { player: true },
  });

  const effective = await resolveEffectiveLineup(user.id, matchday.number);

  const deadlinePassed = now > new Date(matchday.deadline);
  const readOnly = matchday.finalized || deadlinePassed;

  const groups = POSITION_GROUPS.map((g) => ({
    ...g,
    players: squad
      .filter((s) => s.player.position === g.position)
      .map((s) => ({
        id: s.player.id,
        name: s.player.name,
        l1Club: s.player.l1Club,
        currentValue: s.player.currentValue,
      })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Composition de la journee</h1>

      <div className="card">
        <p className="mb-2 text-sm font-medium text-slate-600">Choisir une journee :</p>
        <div className="flex flex-wrap gap-1">
          {matchdays.map((m) => (
            <Link
              key={m.id}
              href={`/lineup?md=${m.number}`}
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

      <div className="card">
        <p className="font-semibold">Journee {matchday.number}</p>
        <p className="text-sm text-slate-500">
          Date limite : {new Date(matchday.deadline).toLocaleString("fr-FR")}
          {matchday.finalized && " - journee finalisee"}
          {!matchday.finalized && deadlinePassed && " - date limite depassee"}
        </p>
        {effective.sourceMatchdayNumber !== matchday.number && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Aucune composition saisie pour cette journee :{" "}
            {effective.sourceMatchdayNumber
              ? `la composition de la journee ${effective.sourceMatchdayNumber} sera utilisee par defaut.`
              : "aucune composition anterieure disponible, l'equipe ne marquera aucun point."}
          </p>
        )}
      </div>

      <LineupForm
        matchdayId={matchday.id}
        groups={groups}
        initialSelected={effective.playerIds}
        readOnly={readOnly}
      />
    </div>
  );
}
