# EchoReport Share Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-report “生成卡牌” flow with three user-selectable original backgrounds and dependency-free 1080 × 1440 PNG export.

**Architecture:** Keep report-to-card content as pure, tested functions in `src/lib/shareCard.ts`. `App.vue` owns only page selection and click handlers, while CSS renders the three background previews and the native Canvas exporter draws the same content into a downloadable image. Decorative generated assets stay optional background layers so text remains live and accessible.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest, CSS, Canvas 2D API, Vite static assets.

## Global Constraints

- Entry is attached to every archived report, alongside the existing report-view action.
- Card aspect ratio is 3:4; exported PNG is exactly 1080 × 1440.
- All three backgrounds display identical report-derived content.
- Footer uses the runtime hostname so deployment needs no source change.
- No new npm runtime dependencies.
- No medical diagnosis, personality diagnosis, copied tarot names, reference-image reuse, or watermarked artwork.

---

### Task 1: Tested card-content model

**Files:**
- Create: `src/lib/shareCard.ts`
- Create: `src/lib/shareCard.test.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: `ArchivedReport` from `src/types.ts`.
- Produces: `ShareCardTheme`, `ShareCardContent`, `createShareCardContent(report, hostname)`, `drawShareCard(canvas, content, theme, image?)`, and `downloadShareCard(report, theme, hostname, image?)`.

- [ ] **Step 1: Write failing tests for deterministic content and safe fallbacks**

```ts
import { describe, expect, it } from 'vitest'
import { createShareCardContent } from './shareCard'

const report = {
  id: 'r1', createdAt: '2026-08-19T00:00:00.000Z', summary: '工作压力',
  title: '关于工作压力的这段话', feelings: '你已经认真看见了这份压力，也在尝试为自己留出空间。',
  evidence: ['最近工作很多'], nextStep: '先休息十分钟', nextQuestion: '什么最消耗你？',
}

describe('createShareCardContent', () => {
  it('derives stable, non-diagnostic share copy', () => {
    expect(createShareCardContent(report, 'example.com')).toMatchObject({
      archetype: '缓慢复原者',
      website: 'example.com',
    })
  })
  it('keeps empathy copy within 44 Chinese characters', () => {
    expect(createShareCardContent({ ...report, feelings: '很长'.repeat(80) }, 'example.com').empathy.length).toBeLessThanOrEqual(44)
  })
  it('falls back to three safe keywords and localhost hostname', () => {
    const result = createShareCardContent({ ...report, title: '', feelings: '', nextStep: '' }, '')
    expect(result.keywords).toHaveLength(3)
    expect(result.website).toBe('127.0.0.1')
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/lib/shareCard.test.ts`

Expected: FAIL because `./shareCard` does not exist.

- [ ] **Step 3: Implement the minimal pure content helpers and Canvas renderer**

Use a small ordered keyword/archetype table, sentence-boundary truncation, three keyword fallbacks, and theme palette objects. Canvas text must use explicit wrapping and draw the hostname in the footer. The renderer must set `canvas.width = 1080` and `canvas.height = 1440` before drawing.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/lib/shareCard.test.ts && npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/lib/shareCard.ts src/lib/shareCard.test.ts
git commit -m "feat: derive safe share card content"
```

### Task 2: Three approved original decorative assets

**Files:**
- Create: `public/cards/holographic-arcana.png`
- Create: `public/cards/art-nouveau-dawn.png`
- Create: `public/cards/gilded-cosmos.png`

**Interfaces:**
- Consumes: the three approved reference directions as style-only inspiration.
- Produces: portrait decorative backgrounds without text, logos, tarot names, people copied from references, or watermarks.

- [ ] **Step 1: Generate each theme as a separate image request**

Every request must reserve a clean central text zone and use a 3:4 portrait composition. The three prompts are: pastel mint/pink/gold original Art Nouveau flora and sun; charcoal/gold celestial glyph field; dark cyan/pink holographic geometry.

- [ ] **Step 2: Copy outputs into `public/cards/` with the exact filenames above**

Expected: three readable background files, each visually distinct at thumbnail size.

- [ ] **Step 3: Inspect all assets and reject text/watermark artifacts**

Run: `file public/cards/*.png`

Expected: three background images. Visually verify central copy area is not obstructed.

- [ ] **Step 4: Commit**

```bash
git add public/cards
git commit -m "feat: add original share card artwork"
```

### Task 3: Report-list entry, card preview, and download interaction

**Files:**
- Modify: `src/App.vue`
- Modify: `src/style.css`
- Test: `src/lib/shareCard.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers and Task 2 theme assets.
- Produces: report-list “查看报告” and “生成卡牌” actions, a responsive card-selection page, theme switching, and PNG download.

- [ ] **Step 1: Add page state and explicit handlers**

Add `cards` to `Page`, plus `cardReport`, `cardTheme`, `isExporting`, `openCards(item)`, `closeCards()`, and `exportCard()`. `openCards` must not mutate `report` or archived data.

- [ ] **Step 2: Replace the archive item button with a semantic article and two buttons**

The title/summary area invokes `showReport(item)`; the separate action invokes `openCards(item)`. Both buttons must include the report title in their `aria-label`.

- [ ] **Step 3: Add card-page markup**

Render the selected 3:4 preview, background picker with three image thumbnails and text labels, dynamic date/content/keywords/hostname, return button, and a disabled export state. Use a hidden canvas only for export.

- [ ] **Step 4: Add responsive and accessible CSS**

Keep the existing EchoReport shell. Use theme-specific palette variables, readable overlay panels where artwork is busy, clear focus rings, at least 44px target height, no horizontal overflow at 320px, and a reduced-motion override.

- [ ] **Step 5: Run type/build/test verification**

Run: `npm test && npm run build`

Expected: all tests PASS and Vite build exits 0.

- [ ] **Step 6: Browser regression**

At desktop and 390px widths verify: every report exposes both actions; viewing reports still works; card page opens the selected report; three backgrounds switch; hostname is visible; download creates a PNG; return restores the report list; console contains no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.vue src/style.css src/lib/shareCard.test.ts
git commit -m "feat: add report share card flow"
```

## Self-review

- Spec coverage: all entry, content, three-background, dynamic-link, download, responsive, accessibility, and regression requirements map to Tasks 1–3.
- Placeholder scan: no deferred product behavior; generated artwork is defined by exact theme and file contract.
- Type consistency: `ShareCardTheme` and `ShareCardContent` originate in Task 1 and are consumed unchanged in Task 3.
