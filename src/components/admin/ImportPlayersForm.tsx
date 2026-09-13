"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importPlayersCsv } from "@/app/admin/players/actions";
import type { ActionState } from "@/lib/action-state";

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Import..." : "Importer"}
    </button>
  );
}

export default function ImportPlayersForm() {
  const [state, formAction] = useFormState(importPlayersCsv, initial);

  return (
    <form action={formAction} className="card space-y-3">
      <div>
        <label className="label">
          Import en masse (une ligne par joueur, format : Nom;Poste;Club L1;Valeur de depart)
        </label>
        <textarea
          name="csv"
          rows={6}
          className="input font-mono text-xs"
          placeholder={"Jonathan David;FWD;Lille;25\nBradley Barcola;FWD;PSG;40"}
        />
        <p className="mt-1 text-xs text-slate-500">
          Poste : GK (gardien), DEF (defenseur), MID (milieu), FWD (attaquant). Un joueur existant
          (meme nom + meme club) est mis a jour au lieu d&apos;etre duplique. Copiez ces donnees
          depuis un export du site lequipe.fr (effectifs Ligue 1) sous forme de tableur.
        </p>
      </div>
      <SubmitButton />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
