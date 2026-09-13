"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateSeasonMatchdays } from "@/app/admin/matchdays/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Creation..." : "Generer les 34 journees"}
    </button>
  );
}

export default function GenerateMatchdaysForm() {
  const [state, formAction] = useFormState(generateSeasonMatchdays, initial);

  return (
    <form action={formAction} className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Date limite - journee 1</label>
        <input type="datetime-local" name="startDate" required className="input" />
      </div>
      <div>
        <label className="label">Intervalle (jours)</label>
        <input type="number" name="intervalDays" defaultValue={7} min={1} required className="input" />
      </div>
      <SubmitButton />
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
