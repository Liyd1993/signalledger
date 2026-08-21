# 9:16 Dialogue Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the identity-summary share card with a 9:16 card that displays up to four real dialogue excerpts and exports at 1080 × 1920.

**Architecture:** Keep the existing `createShareCardContent → ShareCardPreview / drawShareCard` pipeline. Change the shared content type once, then update both HTML and Canvas renderers so every card surface remains identical.

**Tech Stack:** Vue 3, TypeScript, CSS, Canvas 2D, Vitest, Playwright

## Global Constraints

- No new dependency, API, or report archive field.
- Preview aspect ratio is exactly 9:16.
- Export dimensions are exactly 1080 × 1920.
- Show at most four evidence quotes; each quote is at most 38 characters.
- Preserve all three approved backgrounds and existing navigation.

---

### Task 1: Dialogue card content and renderers

**Files:**
- Modify: `src/lib/shareCard.test.ts`
- Modify: `src/lib/shareCard.ts`
- Modify: `src/components/ShareCardPreview.vue`
- Modify: `src/style.css`
- Modify: `src/App.vue`
- Test: `/Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_dialogue_card.py`

**Interfaces:**
- Consumes: `ArchivedReport.evidence`, `ArchivedReport.summary`, `ArchivedReport.feelings`
- Produces: `ShareCardContent.quotes: string[]`, 9:16 Vue preview, 1080 × 1920 Canvas image

- [ ] **Step 1: Write failing unit assertions**

```ts
const result = createShareCardContent({ ...report, evidence: ['第一句', '第二句', '第三句', '第四句', '第五句'] }, 'example.com')
expect(result.quotes).toEqual(['第一句', '第二句', '第三句', '第四句'])
expect('archetype' in result).toBe(false)
expect('empathy' in result).toBe(false)
```

- [ ] **Step 2: Run the unit test and confirm failure**

Run: `npm test -- src/lib/shareCard.test.ts`

Expected: FAIL because `quotes` does not exist and identity fields still exist.

- [ ] **Step 3: Replace identity copy with dialogue excerpts**

```ts
export type ShareCardContent = {
  quotes: string[]
  keywords: [string, string, string]
  date: string
  website: string
}

function dialogueQuotes(report: ArchivedReport) {
  const source = report.evidence.length ? report.evidence : [report.summary || report.feelings]
  return source.filter(Boolean).slice(0, 4).map((text) => truncateQuote(text, 38))
}
```

- [ ] **Step 4: Update the shared Vue preview**

```vue
<div class="share-card-dialogue">
  <small>OUR WORDS</small>
  <h2>我们的话语</h2>
  <ul class="share-card-quotes"><li v-for="quote in content.quotes" :key="quote">{{ quote }}</li></ul>
</div>
```

- [ ] **Step 5: Update Canvas and control copy**

```ts
export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1920

canvas.width = SHARE_CARD_WIDTH
canvas.height = SHARE_CARD_HEIGHT
ctx.fillText('OUR WORDS', SHARE_CARD_WIDTH / 2, 620)
ctx.fillText('我们的话语', SHARE_CARD_WIDTH / 2, 710)
content.quotes.forEach((quote, index) => {
  const y = 900 + index * 190
  wrapLines(ctx, quote, 800, 2).forEach((line, lineIndex) => {
    ctx.fillText(line, SHARE_CARD_WIDTH / 2, y + lineIndex * 62)
  })
})
```

Use the same lower content hierarchy in Vue and change the control label to `下载 9:16 PNG`.

- [ ] **Step 6: Add and run browser regression**

Run:

```bash
npm test
npm run build
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_dialogue_card.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_report_card_side.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_fixed_panels.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_ui.py
```

Expected: all commands pass; the preview is 9:16, identity copy is absent, dialogue copy is visible, and existing flows remain usable.

- [ ] **Step 7: Commit**

```bash
git add src/lib/shareCard.test.ts src/lib/shareCard.ts src/components/ShareCardPreview.vue src/style.css src/App.vue
git commit -m "feat: turn share cards into dialogue keepsakes"
```
