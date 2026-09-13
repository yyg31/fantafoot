import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Position, POSITION_LABELS, SQUAD_SIZE, SQUAD_POSITION_LIMITS, positionLabel } from "@/lib/constants";
import AddButton from "@/components/squad/AddButton";
import RemoveButton from "@/components/squad/RemoveButton";
import LockButton from "@/components/squad/LockButton";

export default async function SquadPage({
  searchParams,
}: {
  searchParams: { q?: string; club?: string; position?: string };
}) {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");

  const [lock, squad, clubs] = await Promise.all([
    prisma.squadLock.findUnique({ where: { userId: user.id } }),
    prisma.squadPlayer.findMany({
      where: { userId: user.id },
      include: { player: true },
      orderBy: { player: { position: "asc" } },
    }),
    prisma.player.findMany({
      where: { active: true },
      select: { l1Club: true },
      distinct: ["l1Club"],
      orderBy: { l1Club: "asc" },
    }),
  ]);

  const spent = squad.reduce((sum, s) => sum + s.purchasePrice, 0);
  const remaining = user.budget - spent;
  const isLocked = !!lock;
  const isFull = squad.length >= SQUAD_SIZE;

  const { q, club, position } = searchParams;
  const ownedIds = new Set(squad.map((s) => s.playerId));

  const candidates = isLocked
    ? []
    : await prisma.player.findMany({
        where: {
          active: true,
          ...(q ? { name: { contains: q } } : {}),
          ...(club ? { l1Club: club } : {}),
          ...(position ? { position: position as Position } : {}),
        },
        orderBy: [{ currentValue: "desc" }],
        take: 100,
      });

  const bySlots = {
    GK: squad.filter((s) => s.player.position === "GK").length,
    DEF: squad.filter((s) => s.player.position === "DEF").length,
    MID: squad.filter((s) => s.player.position === "MID").length,
    FWD: squad.filter((s) => s.player.position === "FWD").length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon effectif ({user.clubName})</h1>

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-slate-500">Budget total</p>
          <p className="text-xl font-bold">{user.budget.toFixed(1)} M€</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Depense</p>
          <p className="text-xl font-bold">{spent.toFixed(1)} M€</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Restant</p>
          <p className="text-xl font-bold text-pitch">{remaining.toFixed(1)} M€</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Effectif</p>
          <p className="text-xl font-bold">
            {squad.length} / {SQUAD_SIZE}
          </p>
        </div>
      </div>

      <div className="card">
        <p className="mb-2 text-sm font-medium text-slate-600">
          Repartition (max par poste) : {bySlots.GK} / {SQUAD_POSITION_LIMITS.GK} gardien(s),{" "}
          {bySlots.DEF} / {SQUAD_POSITION_LIMITS.DEF} defenseur(s), {bySlots.MID} / {SQUAD_POSITION_LIMITS.MID}{" "}
          milieu(x), {bySlots.FWD} / {SQUAD_POSITION_LIMITS.FWD} attaquant(s)
        </p>
        {isLocked ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            Effectif verrouille definitivement le{" "}
            {new Date(lock!.lockedAt).toLocaleDateString("fr-FR")}.
          </p>
        ) : (
          <LockButton disabled={!isFull} />
        )}
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Mes joueurs</h2>
        <div className="card overflow-x-auto">
          <table className="data w-full">
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Poste</th>
                <th>Club L1</th>
                <th>Prix d&apos;achat</th>
                <th>Valeur actuelle</th>
                {!isLocked && <th></th>}
              </tr>
            </thead>
            <tbody>
              {squad.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.player.name}</td>
                  <td>{positionLabel(s.player.position)}</td>
                  <td>{s.player.l1Club}</td>
                  <td>{s.purchasePrice.toFixed(1)} M€</td>
                  <td>{s.player.currentValue.toFixed(1)} M€</td>
                  {!isLocked && (
                    <td>
                      <RemoveButton playerId={s.playerId} />
                    </td>
                  )}
                </tr>
              ))}
              {squad.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500">
                    Aucun joueur selectionne pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!isLocked && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recruter des joueurs</h2>
            <a href="/api/players/export" className="btn-secondary">
              Exporter la liste en CSV
            </a>
          </div>
          <form className="card mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Recherche</label>
              <input type="text" name="q" defaultValue={q} className="input" />
            </div>
            <div>
              <label className="label">Club L1</label>
              <select name="club" defaultValue={club || ""} className="input">
                <option value="">Tous</option>
                {clubs.map((c) => (
                  <option key={c.l1Club} value={c.l1Club}>
                    {c.l1Club}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Poste</label>
              <select name="position" defaultValue={position || ""} className="input">
                <option value="">Tous</option>
                {Object.entries(POSITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn">
              Filtrer
            </button>
          </form>

          <div className="card overflow-x-auto">
            <table className="data w-full">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Poste</th>
                  <th>Club L1</th>
                  <th>Valeur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((p) => {
                  const owned = ownedIds.has(p.id);
                  const affordable = remaining >= p.currentValue;
                  const posKey = p.position as keyof typeof SQUAD_POSITION_LIMITS;
                  const positionFull = bySlots[posKey] >= SQUAD_POSITION_LIMITS[posKey];
                  return (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td>{positionLabel(p.position)}</td>
                      <td>{p.l1Club}</td>
                      <td>{p.currentValue.toFixed(1)} M€</td>
                      <td>
                        {owned ? (
                          <span className="text-xs text-slate-400">Deja recrute</span>
                        ) : positionFull ? (
                          <span className="text-xs text-slate-400">Limite de poste atteinte</span>
                        ) : (
                          <AddButton playerId={p.id} disabled={isFull || !affordable} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500">
                      Aucun joueur trouve.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
