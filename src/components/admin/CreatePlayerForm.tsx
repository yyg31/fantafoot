"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPlayer } from "@/app/admin/players/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Ajout..." : "Ajouter le joueur"}
    </button>
  );
}

export default function CreatePlayerForm() {
  const [state, formAction] = useFormState(createPlayer, initial);

  return (
    <form action={formAction} className="card grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div className="col-span-2 sm:col-span-1">
        <label className="label">Nom</label>
        <input name="name" required className="input" />
      </div>
      <div>
        <label className="label">Poste</label>
        <select name="position" required className="input">
          <option value="GK">Gardien</option>
          <option value="DEF">Defenseur</option>
          <option value="MID">Milieu</option>
          <option value="FWD">Attaquant</option>
        </select>
      </div>
      <div>
        <label className="label">Club L1</label>
        <input name="l1Club" required className="input" />
      </div>
      <div>
        <label className="label">Valeur depart (M€)</label>
        <input name="startValue" type="number" step="0.1" min="0.1" required className="input" />
      </div>
      <div className="flex items-end">
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="col-span-full text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
