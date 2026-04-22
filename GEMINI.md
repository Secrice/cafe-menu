# GEMINI.md - Project Context & Instructions

This project is a **Menu Collector (메뉴 리스트)**, a simple and elegant web application for managing menu items and their quantities. It was developed as a showcase for AI-assisted coding (Claude Code).

## Project Overview

- **Purpose**: A lightweight tool to collect, adjust quantities, and manage a list of menu items (e.g., for office coffee runs or group orders).
- **Architecture**: A Single-Page Application (SPA) where the entire core logic and UI reside in `src/App.jsx`.
- **Primary Tech Stack**:
    - **Framework**: React 18
    - **Build Tool**: Vite
    - **Styling**: Tailwind CSS (with significant use of inline styles for specific layout needs)
    - **Icons**: Lucide React
    - **Persistence**: `localStorage` (keys: `menuHistory`, `menuFavorites`)
- **UI Language**: Korean (한국어)

## Key Features

1.  **Item Management**: Add/delete items, adjust quantities (+/-).
2.  **Inline Editing**: Click on an item name to edit it directly.
3.  **Temperature Selection**: Support for "HOT" and "ICE" labels per item.
4.  **Favorites**: Save current lists as named favorites for quick reloading.
5.  **History**: Automatically tracks recently added items for one-click re-entry.
6.  **Persistence**: All data is saved to `localStorage`, so it survives page refreshes.
7.  **Real-time Totals**: Bottom sticky footer displays the total count of all items and the number of unique types.

## Development Commands

- `npm run dev`: Starts the Vite development server (usually at `http://localhost:5173`).
- `npm run build`: Generates a production-ready build in the `dist/` directory.
- `npm run preview`: Previews the production build locally.

## Project Structure & Conventions

- **`src/App.jsx`**: The "God Component" containing all state (`useState`), side effects (`useEffect`), and UI.
    - **State Management**: Uses React hooks (`useState`). No external state management library (like Redux/Zustand) is used.
    - **Persistence**: `useEffect` hooks sync `history` and `favorites` to `localStorage`.
- **Styling**:
    - Uses a combination of **Tailwind CSS classes** and **inline CSS objects**.
    - Design follows a "Cafe" aesthetic with custom CSS variables (defined in `src/index.css`) like `--espresso`, `--cream`, and `--terracotta`.
- **Editing Flow**: Uses a `editingId` state to toggle between display and input modes for item names.
- **Safety**: Includes "Double-click to confirm" logic for "Clear All" buttons to prevent accidental data loss.

## Deployment

- **Platform**: Vercel
- **Workflow**: Automated deployment is triggered when pushing to the `main` branch.
- **Config**: `vercel.json` is present for platform-specific settings.

## Instructions for Gemini

- **Language**: Maintain the **Korean (한국어)** UI and documentation style.
- **Simplicity**: Keep the architecture simple. Avoid introducing complex folder structures or state management unless explicitly requested.
- **Surgical Edits**: Since `src/App.jsx` contains everything, use targeted `replace` calls to modify specific functions or UI blocks.
- **UI Consistency**: Use the established color palette (`--espresso`, `--cream`, `--terracotta`, etc.) for any new UI elements.
