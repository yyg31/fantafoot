"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerMember } from "./actions";
import type { RegisterState } from "@/lib/action-state";

const initialState: RegisterState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn w-full" disabled={pending}>
      {pending ? "Creation en cours..." : "Creer mon club"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerMember, initialState);

  if (state.success) {
    return (
      <div className="mx-auto max-w-md card">
        <h1 className="mb-2 text-xl font-bold">Inscription reussie !</h1>
        <p className="mb-4 text-sm text-slate-600">
          Votre club a ete cree avec un budget de 220 M€. Vous pouvez maintenant vous connecter.
        </p>
        <Link href="/login" className="btn">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-xl font-bold">Creer mon club</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" required className="input" />
        </div>
        <div>
          <label className="label">Nom du club</label>
          <input type="text" name="clubName" required className="input" />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input type="password" name="password" required minLength={8} className="input" />
        </div>
        <div>
          <label className="label">Confirmer le mot de passe</label>
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={8}
            className="input"
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Deja inscrit ?{" "}
        <Link href="/login" className="text-pitch underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
