import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GenerateMatchdaysForm from "@/components/admin/GenerateMatchdaysForm";
import { updateMatchdayDeadline } from "./actions";

function toLocalInputValue(d: Date) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

async function handleUpdateDeadline(formData: FormData) {
  "use server";
  await updateMatchdayDeadline(formData);
}

export default async function AdminMatchdaysPage() {
  const matchdays = await prisma.matchday.findMany({ orderBy: { number: "asc" } });

  return (
    <div className="space-y-6">
      {matchdays.length === 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Generer le calendrier de la saison</h2>
          <GenerateMatchdaysForm />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Journees ({matchdays.length})</h2>
        <div className="card overflow-x-auto">
          <table className="data w-full">
            <thead>
              <tr>
                <th>Journee</th>
                <th>Date limite</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matchdays.map((m) => {
                const formId = `md-${m.id}`;
                return (
                  <tr key={m.id}>
                    <td className="font-medium">J{m.number}</td>
                    <td>
                      {m.finalized ? (
                        new Date(m.deadline).toLocaleString("fr-FR")
                      ) : (
                        <input
                          type="datetime-local"
                          name="deadline"
                          form={formId}
                          defaultValue={toLocalInputValue(m.deadline)}
                          className="input"
                        />
                      )}
                    </td>
                    <td>
                      {m.finalized ? (
                        <span className="text-green-700">Finalisee</span>
                      ) : new Date() > new Date(m.deadline) ? (
                        <span className="text-amber-700">Cloturee (a finaliser)</span>
                      ) : (
                        <span className="text-slate-500">Ouverte</span>
                      )}
                    </td>
                    <td className="flex gap-2">
                      {!m.finalized && (
                        <form id={formId} action={handleUpdateDeadline}>
                          <input type="hidden" name="id" value={m.id} />
                          <button type="submit" className="btn-secondary">
                            Enregistrer
                          </button>
                        </form>
                      )}
                      <Link href={`/admin/stats?md=${m.number}`} className="btn-secondary">
                        Saisir les stats
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
