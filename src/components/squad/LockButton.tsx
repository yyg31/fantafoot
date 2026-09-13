"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockSquad } from "@/app/squad/actions";

export default function LockButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button className="btn-danger" disabled={disabled} onClick={() => setConfirming(true)}>
        Verrouiller definitivement mon effectif
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3">
      <p className="text-sm font-medium text-red-800">
        Attention : cette action est irreversible. Votre effectif de 22 joueurs sera fige pour
        toute la saison. Confirmer ?
      </p>
      <div className="flex gap-2">
        <button
          className="btn-danger"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const res = await lockSquad();
              if (res.error) setError(res.error);
              router.refresh();
            });
          }}
        >
          {pending ? "Verrouillage..." : "Oui, verrouiller"}
        </button>
        <button className="btn-secondary" onClick={() => setConfirming(false)}>
          Annuler
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
