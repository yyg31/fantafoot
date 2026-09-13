"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePlayerFromSquad } from "@/app/squad/actions";

export default function RemoveButton({ playerId }: { playerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await removePlayerFromSquad(playerId);
          router.refresh();
        });
      }}
    >
      {pending ? "..." : "Retirer"}
    </button>
  );
}
