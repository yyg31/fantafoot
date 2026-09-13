"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitLineup } from "@/app/lineup/actions";
import type { ActionState } from "@/lib/action-state";

type Candidate = { id: string; name: string; l1Club: string; currentValue: number };

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Enregistrement..." : "Valider la composition"}
    </button>
  );
}

export default function LineupForm({
  matchdayId,
  groups,
  initialSelected,
  readOnly,
}: {
  matchdayId: string;
  groups: { position: string; label: string; required: number; players: Candidate[] }[];
  initialSelected: string[];
  readOnly: boolean;
}) {
  const [state, formAction] = useFormState(submitLineup, initial);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function toggle(id: string, groupIds: string[], required: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const inGroup = groupIds.filter((g) => next.has(g));
        if (inGroup.length >= required) return prev;
        next.add(id);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="matchdayId" value={matchdayId} />
      {groups.map((g) => {
        const groupIds = g.players.map((p) => p.id);
        const chosenInGroup = groupIds.filter((id) => selected.has(id)).length;
        return (
          <div key={g.position} className="card">
            <h3 className="mb-2 font-semibold">
              {g.label} ({chosenInGroup} / {g.required})
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {g.players.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      checked ? "border-pitch bg-pitch/5" : "border-slate-200"
                    } ${readOnly ? "opacity-60" : "cursor-pointer"}`}
                  >
                    <span>
                      <input
                        type="checkbox"
                        name="playerIds"
                        value={p.id}
                        checked={checked}
                        disabled={readOnly}
                        onChange={() => toggle(p.id, groupIds, g.required)}
                        className="mr-2"
                      />
                      {p.name} <span className="text-slate-400">({p.l1Club})</span>
                    </span>
                    <span className="text-slate-500">{p.currentValue.toFixed(1)} M€</span>
                  </label>
                );
              })}
              {g.players.length === 0 && (
                <p className="text-sm text-slate-500">Aucun joueur a ce poste dans votre effectif.</p>
              )}
            </div>
          </div>
        );
      })}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}
      {!readOnly && <SubmitButton />}
    </form>
  );
}
