# EchoReport 首页、报告与声音页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable D-style home experience with conversation, persistent report history, and an in-browser audio companion.

**Architecture:** Keep one Vue application and switch screens using a single `page` ref. Move report persistence and audio WAV generation into small native-browser helpers. Keep the existing conversation store responsible only for current-session chat and report creation.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, browser localStorage, Web Audio API.

## Global Constraints

- No new packages and no router.
- Do not claim diagnosis, treatment, or actual image analysis.
- Store only generated reports in localStorage; current chat remains ephemeral.
- Use original generated audio, not copyrighted music assets.

---

### Task 1: Repair transcript layout and introduce page state

**Files:**
- Modify: `src/App.vue`, `src/style.css`
- Test: `work/test_echoreport_ui.py`

- [ ] Add `page` state with `home`, `chat`, `reports`, and `audio` values.
- [ ] Gate current conversation UI behind `page === 'chat'` and add return-home controls.
- [ ] Add `align-content: start` to `.transcript`.
- [ ] Run the browser test after one first message and assert adjacent message bounds.

### Task 2: Add persisted report archive

**Files:**
- Create: `src/lib/reportArchive.ts`, `src/lib/reportArchive.test.ts`
- Modify: `src/types.ts`, `src/App.vue`

- [ ] Write tests for save, newest-first load, and clear with a mocked localStorage.
- [ ] Define `ArchivedReport` as a `ReflectionReport` plus `id`, `createdAt`, and `summary`.
- [ ] Implement native JSON storage under the `echoreport:reports` key, returning an empty array for malformed storage.
- [ ] Save report when generated; render an empty state, list, and detail screen.
- [ ] Run unit tests and build.

### Task 3: Build D-style home and real navigation

**Files:**
- Modify: `src/App.vue`, `src/style.css`
- Test: `work/test_echoreport_ui.py`

- [ ] Create home hero, three collage-style action cards, and a small non-medical disclosure.
- [ ] Wire cards to chat, report archive, and audio pages.
- [ ] Keep all controls keyboard-focusable and labelled.
- [ ] Run browser flow covering all three navigation targets.

### Task 4: Add browser-generated audio companion

**Files:**
- Create: `src/lib/audio.ts`, `src/lib/audio.test.ts`
- Modify: `src/App.vue`, `src/style.css`

- [ ] Test track descriptors and WAV-header output independently.
- [ ] Generate short PCM WAV data from sine/noise samples using typed arrays and expose Blob URLs.
- [ ] Render three selectable tracks and a native audio player with a user-friendly unsupported-browser state.
- [ ] Run unit tests, browser flow, and production build.

### Task 5: Validate and hand off

**Files:**
- Modify: `README.md`, `work/test_echoreport_ui.py`

- [ ] Document local run, report storage behavior, and audio limitation.
- [ ] Run `npm test`, `npm run build`, and `python work/test_echoreport_ui.py`.
- [ ] Commit intentional application and test changes.
