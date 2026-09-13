import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Position } from "../src/lib/constants";

const prisma = new PrismaClient();

/**
 * Jeu de donnees de DEMARRAGE (demo) pour la base des joueurs de Ligue 1.
 *
 * Ce n'est PAS un export exhaustif et parfaitement a jour du championnat :
 * les effectifs changent a chaque mercato. C'est un jeu de donnees realiste
 * qui permet de tester immediatement toutes les fonctionnalites du site
 * (constitution d'effectif, budget, composition, saisie des stats...).
 *
 * Pour disposer de la liste complete et a jour de tous les joueurs de
 * Ligue 1, l'administrateur doit utiliser l'outil d'import en masse
 * (page Admin > Joueurs) en copiant les effectifs depuis lequipe.fr.
 */
const CLUBS: Record<
  string,
  { gk: string[]; def: string[]; mid: string[]; fwd: string[] }
> = {
  "Paris Saint-Germain": {
    gk: ["Gianluigi Donnarumma"],
    def: ["Achraf Hakimi", "Marquinhos", "Nuno Mendes"],
    mid: ["Vitinha", "Fabian Ruiz"],
    fwd: ["Ousmane Dembele", "Bradley Barcola"],
  },
  "Olympique de Marseille": {
    gk: ["Geronimo Rulli"],
    def: ["Facundo Medina", "Leonardo Balerdi", "Ulisses Garcia"],
    mid: ["Adrien Rabiot", "Geoffrey Kondogbia"],
    fwd: ["Mason Greenwood", "Neal Maupay"],
  },
  "AS Monaco": {
    gk: ["Philipp Kohn"],
    def: ["Vanderson", "Wilfried Singo", "Jordan Teze"],
    mid: ["Denis Zakaria", "Mario Lemina"],
    fwd: ["Folarin Balogun", "Breel Embolo"],
  },
  "Olympique Lyonnais": {
    gk: ["Lucas Perri"],
    def: ["Nicolas Tagliafico", "Moussa Niakhate", "Clinton Mata"],
    mid: ["Corentin Tolisso", "Nemanja Matic"],
    fwd: ["Alexandre Lacazette", "Rayan Cherki"],
  },
  "LOSC Lille": {
    gk: ["Berke Ozer"],
    def: ["Aissa Mandi", "Bafode Diakite", "Alexsandro"],
    mid: ["Benjamin Andre", "Ayyoub Bouaddi"],
    fwd: ["Jonathan David", "Edon Zhegrova"],
  },
  "OGC Nice": {
    gk: ["Marcin Bulka"],
    def: ["Jean-Clair Todibo", "Dante", "Melvin Bard"],
    mid: ["Sofiane Diop", "Morgan Sanson"],
    fwd: ["Gaetan Laborde", "Evann Guessand"],
  },
  "RC Lens": {
    gk: ["Brice Samba"],
    def: ["Kevin Danso", "Jonathan Gradit", "Deiver Machado"],
    mid: ["Salis Abdul Samed", "Adrien Thomasson"],
    fwd: ["Florian Sotoca", "Przemyslaw Frankowski"],
  },
  "Stade Rennais": {
    gk: ["Steve Mandanda"],
    def: ["Lorenz Assignon", "Christopher Wooh", "Adrien Truffert"],
    mid: ["Benjamin Bourigeaud", "Baptiste Santamaria"],
    fwd: ["Amine Gouiri", "Arnaud Kalimuendo"],
  },
  "RC Strasbourg": {
    gk: ["Alaa Bellaarouch"],
    def: ["Guela Doue", "Saidou Sow", "Abakar Sylla"],
    mid: ["Habib Diarra", "Andrey Santos"],
    fwd: ["Emanuel Emegha", "Felix Lemarechal"],
  },
  "Toulouse FC": {
    gk: ["Guillaume Restes"],
    def: ["Rasmus Nicolaisen", "Anthony Rouault", "Moussa Diarra"],
    mid: ["Aron Donnum", "Farid El Melali"],
    fwd: ["Thijs Dallinga", "Zakaria Aboukhlal"],
  },
  "FC Nantes": {
    gk: ["Alban Lafont"],
    def: ["Nicolas Pallois", "Andy Pelmard", "Jean-Charles Castelletto"],
    mid: ["Marcus Coco", "Moses Simon"],
    fwd: ["Mostafa Mohamed", "Matthis Abline"],
  },
  "Stade Brestois": {
    gk: ["Marco Bizot"],
    def: ["Bradley Locko", "Lilian Brassier", "Jonas Martin"],
    mid: ["Pierre Lees-Melou", "Romain Del Castillo"],
    fwd: ["Ludovic Ajorque", "Steve Mounie"],
  },
  "Le Havre AC": {
    gk: ["Arthur Desmas"],
    def: ["Ali Abdi", "Mathis Amougou", "Andre Ayew"],
    mid: ["Etienne Youte Kinkoue", "Yassine Kechta"],
    fwd: ["Josue Casimir", "Abdoulaye Sissako"],
  },
  "Stade de Reims": {
    gk: ["Yehvann Diouf"],
    def: ["Yunis Abdelhamid", "Mohamed Kamara", "Junya Ito"],
    mid: ["Amadou Sarr", "Keito Nakamura"],
    fwd: ["Bilal Brahimi", "Georges Mikautadze"],
  },
  "Angers SCO": {
    gk: ["Yahia Fofana"],
    def: ["Jim Allevinah", "Julien Le Cardinal", "Antoine Bernede"],
    mid: ["Himad Abdelli", "Thomas Mangani"],
    fwd: ["Sada Thioub", "Mathias Pereira Lage"],
  },
  "AJ Auxerre": {
    gk: ["Donovan Leon"],
    def: ["Jubal Escalante", "Gideon Mensah", "Rayan Fofana"],
    mid: ["Lassine Sinayoko", "Ibrahim Sissoko"],
    fwd: ["Gauthier Hein", "Yousseph Traore"],
  },
  "Paris FC": {
    gk: ["Obed Nkambadio"],
    def: ["Loick Landre", "Yoram Zague", "Ilan Kebbal"],
    mid: ["Sanousy Ba", "Otar Kiteishvili"],
    fwd: ["Marius Trésor", "Ilyes Housni"],
  },
  "Montpellier HSC": {
    gk: ["Benjamin Lecomte"],
    def: ["Nicolas Cozza", "Thomas Fontaine", "Enzo Tchato"],
    mid: ["Modibo Sagnan", "Khalil Fayad"],
    fwd: ["Ali Abaidia", "Josue Homawoo"],
  },
};

const STAR_VALUES: Record<string, number> = {
  "Ousmane Dembele": 55,
  "Gianluigi Donnarumma": 40,
  "Achraf Hakimi": 45,
  Vitinha: 35,
  "Bradley Barcola": 30,
  "Mason Greenwood": 35,
  "Adrien Rabiot": 25,
  "Folarin Balogun": 22,
  "Jonathan David": 28,
  "Alexandre Lacazette": 18,
  "Rayan Cherki": 25,
  "Georges Mikautadze": 20,
};

function startValueFor(name: string, position: Position): number {
  if (STAR_VALUES[name]) return STAR_VALUES[name];
  const base: Record<Position, number> = { GK: 7, DEF: 9, MID: 11, FWD: 13 };
  const hash = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const variation = (hash % 8) - 3; // +-3.5 M€ de variation deterministe
  return Math.max(2, base[position] + variation);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@fantafoot.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      clubName: "Administration",
      passwordHash,
      role: "ADMIN",
      budget: 220,
    },
  });

  console.log(`Compte admin pret : ${email}`);
}

async function seedPlayers() {
  let created = 0;
  for (const [l1Club, roster] of Object.entries(CLUBS)) {
    const entries: { name: string; position: Position }[] = [
      ...roster.gk.map((name) => ({ name, position: "GK" as Position })),
      ...roster.def.map((name) => ({ name, position: "DEF" as Position })),
      ...roster.mid.map((name) => ({ name, position: "MID" as Position })),
      ...roster.fwd.map((name) => ({ name, position: "FWD" as Position })),
    ];

    for (const { name, position } of entries) {
      const existing = await prisma.player.findFirst({ where: { name, l1Club } });
      if (existing) continue;
      const startValue = startValueFor(name, position);
      await prisma.player.create({
        data: { name, position, l1Club, startValue, currentValue: startValue },
      });
      created++;
    }
  }
  console.log(`${created} joueurs crees.`);
}

async function seedMatchdays() {
  const existing = await prisma.matchday.count();
  if (existing > 0) {
    console.log("Des journees existent deja, aucune creation.");
    return;
  }

  const start = new Date();
  start.setDate(start.getDate() + ((6 - start.getDay() + 7) % 7 || 7)); // prochain samedi
  start.setHours(17, 0, 0, 0);

  const data = Array.from({ length: 34 }, (_, i) => {
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + i * 7);
    return { number: i + 1, deadline };
  });

  await prisma.matchday.createMany({ data });
  console.log("34 journees creees (deadlines hebdomadaires a partir du prochain samedi 17h).");
}

async function main() {
  await seedAdmin();
  await seedPlayers();
  await seedMatchdays();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
