"use client";

import { useMemo, useState } from "react";
import { upsertPlayerStat, deletePlayerStat } from "@/app/admin/stats/actions";

async function handleUpsertStat(formData: FormData) {
  await upsertPlayerStat(formData);
}

async function handleDeleteStat(formData: FormData) {
  await deletePlayerStat(formData);
}

type PlayerRow = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  l1Club: string;
  stat?: {
    goals: number;
    penaltyGoals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsConceded: number | null;
    points: number;
  };
};

export default function StatsTable({
  matchdayId,
  players,
  finalized,
}: {
  matchdayId: string;
  players: PlayerRow[];
  finalized: boolean;
}) {
  const [search, setSearch] = useState("");
  const [onlyEntered, setOnlyEntered] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (onlyEntered && !p.stat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.l1Club.toLowerCase().includes(q);
    });
  }, [players, search, onlyEntered]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Rechercher un joueur ou un club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyEntered}
            onChange={(e) => setOnlyEntered(e.target.checked)}
          />
          Uniquement les joueurs deja saisis
        </label>
        <span className="text-sm text-slate-500">{filtered.length} joueur(s)</span>
      </div>

      <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200">
        <table className="data w-full">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th>Joueur</th>
              <th>Club</th>
              <th>Buts</th>
              <th>dont pen.</th>
              <th>Passes D.</th>
              <th>Jaune</th>
              <th>Rouge</th>
              <th>Buts encaisses (GK)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const formId = `stat-${p.id}`;
              return (
                <tr key={p.id}>
                  <td className="font-medium">
                    {p.name} <span className="text-xs text-slate-400">({p.position})</span>
                  </td>
                  <td>{p.l1Club}</td>
                  <td>
                    <input
                      form={formId}
                      name="goals"
                      type="number"
                      min={0}
                      defaultValue={p.stat?.goals ?? 0}
                      disabled={finalized}
                      className="input w-16"
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="penaltyGoals"
                      type="number"
                      min={0}
                      defaultValue={p.stat?.penaltyGoals ?? 0}
                      disabled={finalized}
                      className="input w-16"
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="assists"
                      type="number"
                      min={0}
                      defaultValue={p.stat?.assists ?? 0}
                      disabled={finalized}
                      className="input w-16"
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="yellowCards"
                      type="number"
                      min={0}
                      max={2}
                      defaultValue={p.stat?.yellowCards ?? 0}
                      disabled={finalized}
                      className="input w-16"
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="redCards"
                      type="number"
                      min={0}
                      max={1}
                      defaultValue={p.stat?.redCards ?? 0}
                      disabled={finalized}
                      className="input w-16"
                    />
                  </td>
                  <td>
                    {p.position === "GK" ? (
                      <input
                        form={formId}
                        name="goalsConceded"
                        type="number"
                        min={0}
                        defaultValue={p.stat?.goalsConceded ?? ""}
                        disabled={finalized}
                        placeholder="auto"
                        className="input w-20"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {!finalized && (
                      <>
                        <form id={formId} action={handleUpsertStat} className="inline">
                          <input type="hidden" name="matchdayId" value={matchdayId} />
                          <input type="hidden" name="playerId" value={p.id} />
                          <button type="submit" className="btn-secondary">
                            Enregistrer
                          </button>
                        </form>
                        {p.stat && (
                          <form action={handleDeleteStat} className="ml-1 inline">
                            <input type="hidden" name="matchdayId" value={matchdayId} />
                            <input type="hidden" name="playerId" value={p.id} />
                            <button type="submit" className="btn-danger">
                              Reset
                            </button>
                          </form>
                        )}
                      </>
                    )}
                    {finalized && p.stat && (
                      <span className="text-sm font-semibold">{p.stat.points} pts</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
