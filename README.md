# Meeple App

This is a small web application designed to coordinate board games events
by voting on boardgames. It is designed to be used by a small group of friends.

It is powered by Astro (HTML Build using Vite), Svelte (reactive components),
Tailwind (Utility CSS Styling) and Firebase (Hosting, Database, Cloud Functions)

## Project Structure

```
/
├─ .vscode/            # VS Code recommended extensions and dev/build scripts
├─ functions/          # firebase cloud functions
│  └─ index.mjs          # functions to proxy BoardGameGeek XML API (no CORS support)
├─ public/             # Favicons and service worker + manifest to make webapp installable
│  └─ firebase.config    # This file needs to be created with API-Keys to your firebase instance
├─ src/                # Code:
│  ├─ components/        # Svelte Components
│  ├─ js/                # Supporting JS code modules
│  ├─ pages/             # Index Page for Astro
│  └─ index.svelte       # Primary routing component
├─ .eslintrc           # Linting with JS Standard Style and Svelte
├─ astro.config        # Configuration for Astro and Vite (Build)
├─ db.rules.json       # Firebase Database Access Rules and Validation
├─ firebase.json       # Firebase Configuration (Deployment and Caching)
├─ package.json        # Node.JS (npm) Dependencies
├─ tailwind.config.cjs # Tailwind configuration
├─ tsconfig.json       # Intellisense and Linting configuration
└─ README.md           # this document
```
## Firebase Config

You will need to provide Firebase API-Keys to your firebase-project.
You can setup a free firebase-project and generate the needed keys in the
firebase console under project-settings (config and messaging)

If you want to work with my personal project and just contribute to
this project, you can copy the configuration from:
https://meeple-cgn.web.app/firebaseConfig.js

## HTTPS and Certificates

To test certain features this app should be run with HTTPs. For this you have to
provide a SSL certificate valid for localhost. This can easily be generated with
an app like "minica". **asto.config** expects the path to your certificate and keyfile
in enviroment variables `LOCAL_CERT` and `LOCAL_KEY`

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                             |
| :--------------------- | :------------------------------------------------- |
| `npm install`          | Installs dependencies                              |
| `npm run dev`          | Starts local dev server at `localhost:3000`        |
| `npm run build`        | Build your production site to `./dist/`            |
| `npm run preview`      | Preview your build locally, before deploying       |
| `firebase login`       | Login to your own firebase project                 |
| `firebase deploy`      | Deploy firebase hosting, functions and database    |

## Firebase Cloud Functions

This project is setup to run with simple Email/Password authentication on firebase
by default. The app can be deployed and run on firebase free of charge, but you
will need at least the Blaze-Plan to access Cloud Functions.
