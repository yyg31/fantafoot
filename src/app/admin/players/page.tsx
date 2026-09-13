import { prisma } from "@/lib/prisma";
import CreatePlayerForm from "@/components/admin/CreatePlayerForm";
import ImportPlayersForm from "@/components/admin/ImportPlayersForm";
import { updatePlayer } from "./actions";

async function handleUpdatePlayer(formData: FormData) {
  "use server";
  await updatePlayer(formData);
}

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({ orderBy: [{ l1Club: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Ajouter un joueur</h2>
        <CreatePlayerForm />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Import en masse</h2>
        <ImportPlayersForm />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Tous les joueurs ({players.length})</h2>
        <div className="card overflow-x-auto">
          <table className="data w-full">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Poste</th>
                <th>Club L1</th>
                <th>Valeur depart</th>
                <th>Valeur actuelle</th>
                <th>Points</th>
                <th>Actif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const formId = `edit-player-${p.id}`;
                return (
                  <tr key={p.id}>
                    <td>
                      <input name="name" form={formId} defaultValue={p.name} className="input" />
                    </td>
                    <td>
                      <select name="position" form={formId} defaultValue={p.position} className="input">
                        <option value="GK">GK</option>
                        <option value="DEF">DEF</option>
                        <option value="MID">MID</option>
                        <option value="FWD">FWD</option>
                      </select>
                    </td>
                    <td>
                      <input name="l1Club" form={formId} defaultValue={p.l1Club} className="input" />
                    </td>
                    <td>
                      <input
                        name="startValue"
                        form={formId}
                        type="number"
                        step="0.1"
                        defaultValue={p.startValue}
                        className="input"
                      />
                    </td>
                    <td>{p.currentValue.toFixed(1)} M€</td>
                    <td>{p.totalPoints}</td>
                    <td>
                      <input type="checkbox" name="active" form={formId} defaultChecked={p.active} />
                    </td>
                    <td>
                      <form id={formId} action={handleUpdatePlayer}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="btn-secondary">
                          Enregistrer
                        </button>
                      </form>
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
