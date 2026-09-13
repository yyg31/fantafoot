"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // Sous un sous-chemin (BASE_PATH, ex: /fanta), next-auth ne detecte pas
  // automatiquement le prefixe cote client : on le lui passe explicitement.
  const basePath = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth`;
  return (
    <NextAuthSessionProvider session={session} basePath={basePath}>
      {children}
    </NextAuthSessionProvider>
  );
}
