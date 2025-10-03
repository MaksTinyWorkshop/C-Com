# Boilerplate Vitrine Astro

Un point de départ pour créer des sites vitrines statiques avec [Astro](https://astro.build). Les pages sont composées de sections réutilisables décrites dans des fichiers Markdown afin que la rédaction et l'assemblage puissent être réalisés sans connaissance du code.

## Installation

```bash
npm install
```

## Scripts disponibles

- `npm run dev` — Lance le serveur de développement
- `npm run build` — Construit la version statique de production
- `npm run preview` — Prévisualise la version buildée
- `npm run lint` — Vérifie le typage et le schéma des contenus

## Structure du projet

```
├── public/
│   └── images/
├── src/
│   ├── components/         # Composants Astro réutilisables
│   ├── content/
│   │   ├── pages/          # Pages en Markdown (frontmatter + sections)
│   │   └── sections/       # Sections réutilisables en Markdown
│   ├── layouts/            # Layouts globaux
│   ├── lib/                # Utilitaires (rendu des sections)
│   ├── pages/              # Routes Astro (`index`, `[slug]`, `404`)
│   └── styles/             # Styles globaux
```

## Créer ou modifier une page

1. Dupliquez une page dans `src/content/pages` ou créez-en une nouvelle (`nouvelle-page.md`).
2. Renseignez son frontmatter : titre, description et liste des sections à afficher.
3. Pour chaque section, choisissez un slug existant ou créez-en un nouveau dans `src/content/sections`.

Chaque section possède :

- Un champ `component` qui détermine le composant Astro utilisé (`hero`, `feature-grid`, `testimonials`, `markdown`, `cta`).
- Des champs frontmatter spécifiques selon le composant (CTA, listes, visuels…).
- Pour les sections `markdown`, le contenu de la section se rédige dans le corps du fichier.

## Ajouter un nouveau type de section

1. Créez un composant Astro dans `src/components`.
2. Mettez à jour le schéma dans `src/content/config.ts` pour décrire le nouveau frontmatter.
3. Complétez le mapping dans `src/lib/sectionRenderer.ts` pour associer le composant et ses props.
4. Créez une nouvelle section Markdown qui utilise le nouveau `component`.

## Personnalisation

- Modifiez les couleurs et la typographie depuis `src/styles/global.css`.
- Remplacez le logo et les images dans `public/`.
- Ajustez la navigation principale dans `src/layouts/BaseLayout.astro`.

## Déploiement

La commande `npm run build` génère un dossier `dist/` statique prêt à être déployé sur n'importe quel hébergeur statique (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.).

---

Ce boilerplate est volontairement simple pour faciliter la prise en main. N'hésitez pas à l'adapter : intégration CMS, formulaires, animations, Tailwind, etc.
