# icalledgame: soccer edition

## Local development

```bash
npm install
npm run dev
```

## Production / Heroku

Heroku uses the `build` script during deploy and starts the compiled app with `npm start`. The Node server reads Heroku's `PORT` value and serves the Vite output from `dist`.

```bash
npm run build
npm start
```

The current match photograph is loaded from Wikimedia Commons at runtime. It is not stored in this repository or on Heroku's filesystem. The UI includes attribution for Jimmy Baikovicius under CC BY-SA 2.0.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
