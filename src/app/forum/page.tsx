import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import PostMessageForm from "@/components/forum/PostMessageForm";

export default async function ForumPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const messages = await prisma.forumMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forum</h1>
        <p className="text-sm text-slate-500">
          Discussion libre entre membres, sans moderation. Les messages les plus recents s&apos;affichent
          en premier.
        </p>
      </div>

      <PostMessageForm />

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="card">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="font-semibold">{m.user.clubName}</span>
              <span className="text-xs text-slate-400">
                {new Date(m.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-slate-500">
            Aucun message pour le moment. Soyez le premier a ecrire !
          </p>
        )}
      </div>
    </div>
  );
}
