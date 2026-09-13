"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPlayerToSquad } from "@/app/squad/actions";

export default function AddButton({ playerId, disabled }: { playerId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-secondary"
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await addPlayerToSquad(playerId);
            if (res.error) setError(res.error);
            router.refresh();
          });
        }}
      >
        {pending ? "..." : "Ajouter"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
