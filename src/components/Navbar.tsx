import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  const links = session
    ? [
        { href: "/", label: "Accueil" },
        { href: "/players", label: "Joueurs" },
        { href: "/squad", label: "Mon effectif" },
        { href: "/lineup", label: "Composition" },
        { href: "/ranking", label: "Classement" },
        ...(session.user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/players", label: "Joueurs" },
        { href: "/ranking", label: "Classement" },
      ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-pitch">
          ⚽ Fantafoot
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-pitch">
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <span className="text-slate-400">|</span>
              <span className="font-medium text-slate-700">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-pitch">
                Connexion
              </Link>
              <Link href="/register" className="btn !px-3 !py-1.5">
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
