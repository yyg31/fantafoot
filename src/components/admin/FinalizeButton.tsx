"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { finalizeMatchday } from "@/app/admin/stats/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-danger" disabled={pending}>
      {pending ? "Finalisation en cours..." : "Oui, finaliser definitivement"}
    </button>
  );
}

export default function FinalizeButton({ matchdayId }: { matchdayId: string }) {
  const [state, formAction] = useFormState(finalizeMatchday, initial);
  const [confirming, setConfirming] = useState(false);

  if (state.success) {
    return <p className="text-sm font-medium text-green-700">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button className="btn-danger" onClick={() => setConfirming(true)}>
        Finaliser cette journee
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3">
      <input type="hidden" name="matchdayId" value={matchdayId} />
      <p className="text-sm font-medium text-red-800">
        Cette action fige les points, met a jour les valeurs des joueurs et calcule les scores des
        clubs pour cette journee. Elle est irreversible. Confirmer ?
      </p>
      <div className="flex gap-2">
        <SubmitButton />
        <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
          Annuler
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
