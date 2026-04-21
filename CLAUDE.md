# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
```

No test runner is configured.

## Architecture

Single-page React app (Vite + Tailwind CSS) for collecting and managing a menu list. The entire application lives in `src/App.jsx` — there are no sub-components or routing.

**State & persistence:** All state is managed with `useState` in `App.jsx`. Items are persisted to `localStorage` under the key `menuItems` via a `useEffect`. Each item has `{ id: Date.now(), name: string, count: number }`.

**UI structure:**
- Sticky header
- Scrollable list of menu items with inline name editing (click to edit, blur/Enter to confirm) and ± count controls
- Fixed footer showing total types/count and a "clear all" button

**Deployment:** Vercel — `npm run build` outputs to `dist/`. GitHub 푸시 시 Vercel이 자동 배포.

The UI is in Korean.
