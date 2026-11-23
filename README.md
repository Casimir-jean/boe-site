# BOÉ MULTI-SERVICES — Site public immobilier

Projet React + Vite + Tailwind CSS 4 (site public uniquement, sans espace administrateur).

## Lancer en local (Node.js requis)
```bash
npm install
npm run dev
```
Ouvrez l'adresse affichée (http://localhost:5173).

## Publier sur Netlify
1. Envoyez le dossier sur GitHub (ou glissez-le sur Netlify).
2. Netlify lit `netlify.toml` : commande `npm run build`, dossier `dist`.

## Modifier le contenu
- Annonces et numéros de contact : en haut de `src/App.tsx` (`INITIAL_PROPERTIES`, `INITIAL_SETTINGS`).
- Logo / icône : `public/logo.jpeg`.

## Lien avec le Manager (Supabase)
Le site lit les annonces publiées dans Supabase si ces variables existent (voir `.env.example`) :
`VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. Sans elles, il affiche les annonces écrites dans `src/App.tsx`.
