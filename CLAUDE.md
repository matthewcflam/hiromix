# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive horizontal timeline website built with Next.js 14 (App Router) and TypeScript. Displays photos, videos, sticky notes, and a music player with cinematic scrolling and sound effects. Originally inspired by https://tlb.betteroff.studio/.

## Commands

```bash
npm run dev              # Dev server at http://localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint (extends next/core-web-vitals)
npm run analyze          # Bundle analysis (sets ANALYZE=true)
npm run validate:timeline # Check timeline media file references
```

No test framework is configured.

## Architecture

**Single-page app** — everything renders from `src/app/page.tsx`, which dynamically imports the two heaviest components (TimelineCarousel, MusicPlayer) for code splitting.

### Core Components

- **TimelineCarousel** (`src/components/TimelineCarousel.tsx`) — The central component (~43KB). Implements a virtualized horizontal carousel with Lenis physics-based smooth scrolling. Calculates dynamic spacing based on date gaps between timeline items. Handles viewport-based rendering with overscan, sticky note integration, and velocity-based tick sounds on scroll.
- **MusicPlayer** (`src/components/MusicPlayer.tsx`) — Howler.js audio playback with queue management, shuffle, and Windows 95-style volume slider. Volume persists to localStorage.
- **StickyNote** (`src/components/StickyNote.tsx`) — Draggable, editable notes with multiple color palettes. Syncs to Supabase in realtime when configured, otherwise falls back to localStorage.
- **LoadingScreen** (`src/components/LoadingScreen.tsx`) — Configurable loading overlay with pond background, GIF, and percentage counter. Settings in `src/lib/loadingScreenConfig.ts`.

### Data Layer

- `src/data/timeline.ts` — Array of `TimelineItem` objects with dates, media paths, and display metadata. Dates must be ISO 8601. The carousel positions items chronologically and adjusts spacing dynamically.
- `src/data/music.ts` — Array of `MusicTrack` objects with a `shuffleTracks()` export.
- `src/types/index.ts` — All shared TypeScript interfaces (`TimelineItem`, `MusicTrack`, `StickyNoteRecord`).

### Backend / State

- **Supabase** (optional) — Used only for realtime sticky note sync. Schema in `supabase/sticky_notes_schema.sql`. Without Supabase env vars, sticky notes use localStorage only.
- **Sound system** (`src/lib/useSoundManager.ts`) — Custom hook managing UI sound effects via Howler.js. Degrades gracefully when audio files are missing.
- **Supabase client** (`src/lib/supabaseClient.ts`) — Browser-only Supabase initialization; returns `null` when env vars are absent.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Environment Variables

All optional. Set in `.env.local` (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Enable realtime sticky notes
- `NEXT_PUBLIC_STICKY_NOTES_REALTIME` — Feature flag for realtime (default: `true`)
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` — Higher Unsplash rate limits

## Static Assets

Media files live under `public/`:
- `public/images/` — Timeline photos
- `public/videos/` — Timeline videos
- `public/music/` — Audio tracks
- `public/covers/` — Album artwork
- `public/sounds/` — SFX files (ticks, paper sounds)
- `public/assets/loading/` — Loading screen assets (pond background, GIF)

## Key Dependencies

- **Lenis** — Physics-based smooth scrolling with momentum (the carousel's scrolling engine)
- **Framer Motion** — All component animations and transitions
- **Howler.js** — Cross-browser audio for both music playback and UI sound effects
- **Three.js / @react-three/fiber** — 3D rendering capabilities
- **Radix UI + shadcn** — Accessible UI primitives (`components.json` configures shadcn)

## Styling

Tailwind CSS with a monochrome theme defined in `tailwind.config.ts`. Custom animations (fadeIn, slideUp, blurIn, scaleIn) and utilities (glass display, retro pink gradients) are defined in `src/app/globals.css`. Three Google Fonts are loaded: Inter (body), Reenie Beanie (handwriting), Roboto.
