import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const tabs = [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/admin/players", label: "Joueurs" },
    { href: "/admin/matchdays", label: "Journees" },
    { href: "/admin/stats", label: "Saisie des stats" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Administration</h1>
      <p className="mb-4 text-sm text-slate-500">
        Ces outils sont reserves aux administrateurs du site.
      </p>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
