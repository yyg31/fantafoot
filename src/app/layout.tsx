import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantafoot - Fantasy Ligue 1",
  description: "Jeu de fantasy football base sur le championnat de France de Ligue 1",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fr">
      <body>
        <SessionProvider session={session}>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
