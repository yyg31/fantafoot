/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permet de servir le site sous un sous-chemin (ex: BASE_PATH=/fanta
  // pour http://mon-serveur/fanta). Vide par defaut (racine du domaine).
  basePath: process.env.BASE_PATH || "",
};

module.exports = nextConfig;
