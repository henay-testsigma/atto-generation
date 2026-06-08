# Atto Generation

Event-driven prototype of Testsigma's **"Atto"** agentic test-generation UX (Vite 8 + React 19 +
TypeScript), plus a `/catalog` living-spec documenting how every wire event renders. See `CLAUDE.md`
for the full architecture.

## Setup

This app depends on the **private** `@testsigmainc/ui-atoms` package from GitHub Packages, so npm
needs a token. The committed `.npmrc` reads it from the `NODE_AUTH_TOKEN` environment variable (no
token is stored in the repo):

```bash
export NODE_AUTH_TOKEN=<a GitHub PAT with read:packages>   # add to your shell profile to persist
npm install
npm run dev        # http://localhost:5173/  (prototype)  ·  /catalog (event catalog)
npm run build      # tsc -b && vite build
npm run gen:ledger # regenerate src/prototype/catalog/ledger.ts from tier-decision-doc.html
```

## Deploying to Vercel

- Framework preset **Vite** (build `npm run build`, output `dist`) is auto-detected.
- Add a **`NODE_AUTH_TOKEN`** environment variable in the Vercel project settings (a GitHub PAT with
  `read:packages`) so the install step can fetch `@testsigmainc/ui-atoms`.
- `vercel.json` rewrites all paths to `index.html` so client routes like `/catalog` resolve on direct
  load / refresh (the app routes on `window.location.pathname`).

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
