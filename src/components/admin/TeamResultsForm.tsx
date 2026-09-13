"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveTeamResults } from "@/app/admin/stats/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Enregistrement..." : "Enregistrer les resultats d'equipe"}
    </button>
  );
}

export default function TeamResultsForm({
  matchdayId,
  clubs,
  goalsConcededByClub,
  disabled,
}: {
  matchdayId: string;
  clubs: string[];
  goalsConcededByClub: Record<string, number>;
  disabled: boolean;
}) {
  const [state, formAction] = useFormState(saveTeamResults, initial);

  return (
    <form action={formAction} className="card">
      <input type="hidden" name="matchdayId" value={matchdayId} />
      <input type="hidden" name="clubs" value={JSON.stringify(clubs)} />
      <p className="mb-3 text-sm text-slate-600">
        Buts encaisses par chaque club sur la journee (permet de calculer automatiquement les
        clean-sheets et malus des gardiens/defenseurs pour tous les joueurs du club, sans avoir a
        les saisir un par un).
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {clubs.map((club) => (
          <div key={club}>
            <label className="label">{club}</label>
            <input
              type="number"
              name={`gc_${club}`}
              min={0}
              defaultValue={goalsConcededByClub[club] ?? ""}
              disabled={disabled}
              className="input"
            />
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="mt-3">
          <SubmitButton />
        </div>
      )}
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
