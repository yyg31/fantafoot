import { prisma } from "@/lib/prisma";
import { Position, POSITION_LABELS, positionLabel } from "@/lib/constants";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { q?: string; club?: string; position?: string };
}) {
  const { q, club, position } = searchParams;

  const players = await prisma.player.findMany({
    where: {
      active: true,
      ...(q ? { name: { contains: q } } : {}),
      ...(club ? { l1Club: club } : {}),
      ...(position ? { position: position as Position } : {}),
    },
    orderBy: [{ currentValue: "desc" }],
  });

  const clubs = await prisma.player.findMany({
    where: { active: true },
    select: { l1Club: true },
    distinct: ["l1Club"],
    orderBy: { l1Club: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Base des joueurs - Ligue 1</h1>

      <form className="card mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Recherche</label>
          <input type="text" name="q" defaultValue={q} placeholder="Nom du joueur" className="input" />
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
              <th>Points saison</th>
              <th>Valeur depart</th>
              <th>Valeur actuelle</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td>{positionLabel(p.position)}</td>
                <td>{p.l1Club}</td>
                <td>{p.totalPoints}</td>
                <td>{p.startValue.toFixed(1)} M€</td>
                <td className="font-semibold">{p.currentValue.toFixed(1)} M€</td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-500">
                  Aucun joueur trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
