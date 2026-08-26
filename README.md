# Business Cost Calculator

A mobile-first, browser-based calculator for any small business or product. Add batch-total or per-unit costs; calculate cost per unit; compare markup-based selling-price suggestions; and see profit, margin, potential revenue, and potential profit instantly.

All calculations run locally in the browser. The application has no authentication, database, or external API.

Products are saved only in the current browser. Use **Export Backup** to move or protect data, and **Import Backup** to restore it on another device.

## Install

Requires a current version of Node.js (20 or newer is recommended).

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. The project uses a small dependency-free development server.

## Test

```bash
npm test
```

## Production build

```bash
npm run build
```

The optimized production files are written to `dist/`. To inspect that build locally, run:

```bash
npm run preview
```
