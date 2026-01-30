# Déploiement sur PLMlab Pages et PLMshift (CNRS)

Ce document explique comment héberger cette site statique généré par Astro et React sur l’infrastructure du **CNRS – Plateforme en Ligne pour les Mathématiques (PLM)**.  Deux services distincts sont proposés :

- **PLMlab Pages** : un hébergement de sites **statiques** basé sur GitLab Pages.  C’est la solution la plus simple pour un site personnel, car elle ne demande aucun serveur dynamique ni base de données.  Un site Astro + React se compile en fichiers statiques prêts pour Pages.
- **PLMshift (OpenShift)** : un hébergement conteneurisé pour des applications web **dynamiques** (WordPress, bases de données, API, etc.).  Ce service est plus flexible mais demande plus de maintenance.  Il n’est pas nécessaire pour une page personnelle statique.

Pour un doctorant souhaitant publier un site vitrine (publications, enseignements, blog…), **PLMlab Pages** est généralement recommandé.  Si un jour vous avez besoin d’une partie dynamique (base de données, API en Node.js, etc.), vous pourrez migrer vers PLMshift.

## 1. Prérequis administratifs

1. **Compte PLM** : assurez‑vous de disposer d’un compte utilisateur PLM (également appelé compte Mathrice).  Si vous n’en avez pas, contactez le correspondant PLM de votre laboratoire pour en obtenir un.
2. **Convention d’hébergement** : avant d’obtenir l’accès, la PLM demande de signer la convention d’hébergement.  Cette convention stipule que le directeur de votre laboratoire est directeur de publication du site et que vous (ou un responsable désigné) en êtes le directeur de rédaction.  Elle précise également vos obligations de maintenance et de conformité légale (mentions légales, contenu non commercial, mise à jour des composants, etc.).
3. **Nom de domaine** : par défaut, GitLab Pages fournit une URL de la forme `https://<projet>.pages.math.cnrs.fr`.  Pour une page personnelle, vous pouvez demander un alias `https://<login>.perso.math.cnrs.fr` auprès de la PLM.  Le correspondant PLM local fera la demande de DNS et certificat.  Cette étape est optionnelle mais donne une adresse plus conviviale.

## 2. Création du projet sur PLMlab GitLab

La première étape technique consiste à créer un projet sur la forge GitLab de la PLM : <https://plmlab.math.cnrs.fr>.  Après vous être connecté avec votre compte PLM :

1. Cliquez sur **“New project”** et choisissez **“Create blank project”**.
2. Donnez un nom à votre projet, par exemple `site-personnel`.  Ce nom servira à générer l’URL par défaut `https://site-personnel.pages.math.cnrs.fr`.
3. Choisissez la visibilité de votre projet (privé si vous ne souhaitez pas que le code soit public).  GitLab Pages fonctionne aussi bien avec des dépôts privés que publics.
4. Initialisez un dépôt vide (GitLab peut créer un fichier `README` automatiquement si vous le souhaitez).  Une fois le projet créé, notez l’URL du dépôt (par ex. `https://plmlab.math.cnrs.fr/votre_groupe/site-personnel.git`).

## 3. Copier ce dépôt dans le projet PLMlab

Clonez le dépôt Git que vous venez de créer sur votre machine ou sur l’agent qui gère votre site :

```bash
git clone https://plmlab.math.cnrs.fr/votre_groupe/site-personnel.git
cd site-personnel
```

Copiez ensuite l’intégralité des fichiers de ce repository **astro-react-site** dans ce dépôt.  Cela inclut `package.json`, `astro.config.mjs`, `src/`, `public/`, `.gitlab-ci.yml`, etc.  Pour un agent LLM, cela signifie :

```bash
cp -R /path/to/personal-page/* .
git add .
git commit -m "Initial commit of personal-page"
git push origin main
```

Assurez‑vous que le fichier `.gitlab-ci.yml` est présent à la racine, car il est indispensable pour que GitLab CI construise et publie le site.

## 4. Configurer GitLab CI avec `.gitlab-ci.yml`

GitLab Pages utilise un pipeline CI/CD pour construire puis exposer le contenu de votre site.  Le fichier `.gitlab-ci.yml` fourni dans ce dépôt effectue les actions suivantes :

```yaml
image: node:18

pages:
  cache:
    paths:
      - node_modules/
  script:
    - npm install
    - npm run build
    - mv dist public # GitLab Pages sert le dossier `public`
  artifacts:
    paths:
      - public
  only:
    - main
```

En résumé, GitLab CI exécute `npm install` pour récupérer les dépendances (Astro, React, etc.), lance `npm run build` pour générer les fichiers statiques dans `dist/`, puis renomme `dist` en `public/` car GitLab Pages sert automatiquement ce dossier.  Les artefacts du pipeline sont déployés et votre site est accessible à l’URL assignée à votre projet.

Si vous utilisez une branche différente de `main`, modifiez `only: - main` par le nom de votre branche.

## 5. Déploiement et test

Après avoir poussé votre commit, GitLab va déclencher un pipeline CI.  Vous pouvez suivre sa progression dans **CI/CD > Pipelines** sur l’interface web.  Une fois le pipeline réussi, allez dans **Settings > Pages** du projet pour trouver l’URL de votre site.  Elle sera du type :

```
https://<votre-projet>.pages.math.cnrs.fr
```

Testez l’accès à cette URL : votre site Astro devrait apparaître avec la page d’accueil et le composant React.

## 6. Demander un alias `perso.math.cnrs.fr` (optionnel)

Si vous souhaitez une adresse de la forme `https://<login>.perso.math.cnrs.fr`, contactez votre correspondant PLM ou ouvrez un ticket auprès du support PLM.  Indiquez le nom de votre projet GitLab et demandez l’association de l’alias.  La PLM créera le DNS et un certificat Let’s Encrypt pour sécuriser l’accès en HTTPS.  Une fois l’alias actif, GitLab Pages redirigera automatiquement l’URL par défaut vers votre nouveau domaine.

## 7. Notes sur PLMshift

Dans certains cas, un site statique ne suffit pas.  Si vous avez besoin d’un blog avec une base de données, de rendre vos pages côté serveur (SSR) ou d’une API back‑end en Node.js, vous devrez passer par **PLMshift**.  PLMshift est une plateforme OpenShift (OKD) qui permet de déployer des conteneurs.  Vous y pouvez déployer un serveur Node ou un CMS comme WordPress.  La configuration est plus complexe (builds, déploiements, variables d’environnement).  Tant que votre site reste entièrement statique, PLMlab Pages reste la solution la plus simple et la plus fiable.

## 8. Ressources et documentation

- Documentation officielle PLM (hébergement web) : <https://plmdoc.math.cnrs.fr/utilisateurs/hebergement-web/>
- Guide PLMlab Pages : <https://plmdoc.math.cnrs.fr/utilisateurs/plmlab-pages/>
- Guide Astro : <https://docs.astro.build>
- GitLab Pages documentation : <https://docs.gitlab.com/user/project/pages/> 

---

En suivant ces étapes, vous pourrez mettre en ligne votre site personnel de doctorant en mathématiques sur l’infrastructure du CNRS.  Comme le site repose sur des fichiers statiques, la maintenance est minime et il suffit de pousser vos modifications sur GitLab pour mettre à jour le site.  Si vous êtes un agent LLM chargé d’automatiser ce processus, n’oubliez pas de mettre à jour la branche principale avec votre contenu et de surveiller les pipelines pour vous assurer que la publication se déroule correctement.
