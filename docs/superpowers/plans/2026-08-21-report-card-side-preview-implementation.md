# Report Card Side Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在报告详情桌面端右侧展示当前报告生成的 3:4 卡牌，并让用户点击进入现有卡牌编辑与下载页。

**Architecture:** 把现有卡牌预览模板抽成一个纯展示 Vue 组件，卡牌编辑页和报告详情共同复用。报告详情用响应式布局包装现有固定高度报告：桌面显示右侧卡牌，手机在报告滚动内容末尾显示卡牌入口。

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, CSS Grid, Playwright 回归脚本

## Global Constraints

- 不新增依赖、API 或第二份卡牌数据。
- 报告外框继续保持统一固定高度，内容只在框内滚动。
- 桌面断点为 `960px`；手机不得产生横向滚动。
- 卡牌预览与卡牌页使用同一份组件、主题资源和内容生成结果。
- 保留报告列表进入、卡牌背景切换、PNG 下载和音频播放现有流程。

---

### Task 1: 复用卡牌预览并加入报告双栏

**Files:**
- Create: `src/components/ShareCardPreview.vue`
- Modify: `src/App.vue`
- Modify: `src/style.css`
- Test: `/Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_report_card_side.py`

**Interfaces:**
- Consumes: `ShareCardContent`, `ShareCardTheme`, `shareCardThemes`, `createShareCardContent(report, hostname)`, `openCards(item)`
- Produces: `ShareCardPreview` props `{ content: ShareCardContent; theme: ShareCardTheme; asset: string }`，以及 `.report-layout`、`.report-side-card`、`.report-mobile-card` 响应式结构

- [ ] **Step 1: 写失败的浏览器回归测试**

```python
page.set_viewport_size({"width": 1504, "height": 1324})
page.get_by_role("button", name="看看变化").click()
page.locator(".archive-copy").first.click()
report_box = page.locator(".report-card").bounding_box()
card_box = page.locator(".report-side-card").bounding_box()
assert card_box["x"] > report_box["x"] + report_box["width"]
page.locator(".report-side-card button").click()
assert page.locator(".card-studio").is_visible()
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_report_card_side.py`

Expected: FAIL，因为 `.report-side-card` 尚不存在。

- [ ] **Step 3: 抽出卡牌预览组件**

```vue
<script setup lang="ts">
import type { ShareCardContent, ShareCardTheme } from '../lib/shareCard'
defineProps<{ content: ShareCardContent; theme: ShareCardTheme; asset: string }>()
</script>

<template>
  <article class="share-card-preview" :class="`theme-${theme}`">
    <img class="share-card-art" :src="asset" alt="" />
    <div class="share-card-frame">
      <div class="share-card-meta"><span>ECHO CARD</span><time>{{ content.date }}</time></div>
      <div class="share-card-copy"><small>MY INNER NOTE</small><h2>{{ content.archetype }}</h2><p>“{{ content.empathy }}”</p></div>
      <ul class="share-card-keywords"><li v-for="keyword in content.keywords" :key="keyword">{{ keyword }}</li></ul>
      <footer><small>基于一次真实表达生成 · 非医疗建议</small><a href="#" @click.prevent>EchoReport · {{ content.website }}</a></footer>
    </div>
  </article>
</template>
```

- [ ] **Step 4: 在报告详情复用同一组件与数据**

```ts
const archivedReport = computed(() => report.value && 'createdAt' in report.value ? report.value : null)
const reportCardContent = computed(() => archivedReport.value ? createShareCardContent(archivedReport.value, window.location.hostname) : null)
const reportPreviewTheme = shareCardThemes[0]
```

```vue
<section class="report-layout">
  <section class="report-card" aria-label="专属报告">
    <button class="back-button" type="button" @click="report = null; page = 'reports'">← 回到报告列表</button>
    <div class="report-hero"><p class="eyebrow">YOUR REFLECTION</p><span>✦</span><h1>{{ report?.title }}</h1><p>这份报告只依据你刚才的表达生成。</p></div>
    <article class="report-section"><h2>你表达出的感受</h2><p>{{ report?.feelings }}</p></article>
    <article class="report-section evidence"><h2>对话里的线索</h2><blockquote v-for="line in report?.evidence" :key="line">“{{ line }}”</blockquote></article>
    <article class="report-section"><h2>可以尝试的一小步</h2><p>{{ report?.nextStep }}</p></article>
    <article class="report-section"><h2>下次可以继续聊</h2><p>{{ report?.nextQuestion }}</p></article>
    <button v-if="archivedReport && reportCardContent" class="report-mobile-card" type="button" @click="openCards(archivedReport)">
      <ShareCardPreview :content="reportCardContent" :theme="reportPreviewTheme.id" :asset="reportPreviewTheme.asset" />
      <span>查看并下载 →</span>
    </button>
    <p class="report-disclaimer">这不是诊断、治疗或紧急服务。需要帮助时，请联系专业服务或可信任的人。</p>
  </section>
  <aside v-if="archivedReport && reportCardContent" class="report-side-card">
    <button type="button" @click="openCards(archivedReport)">
      <ShareCardPreview :content="reportCardContent" :theme="reportPreviewTheme.id" :asset="reportPreviewTheme.asset" />
      <span>查看并下载 →</span>
    </button>
  </aside>
</section>
```

- [ ] **Step 5: 添加响应式布局**

```css
.report-layout { width: min(100%, 560px); margin: 0 auto; }
.report-side-card { display: none; }
.report-mobile-card { display: block; }

@media (min-width: 960px) {
  .report-layout { display: grid; width: min(100%, 952px); grid-template-columns: 560px 360px; gap: 32px; align-items: center; }
  .report-side-card { display: block; }
  .report-mobile-card { display: none; }
}
```

- [ ] **Step 6: 运行浏览器回归和现有测试**

Run:

```bash
npm test
npm run build
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_report_card_side.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_fixed_panels.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_ui.py
python3 /Users/liyd/Documents/Codex/2026-08-11/new-chat/work/test_echoreport_smoke.py
```

Expected: 所有命令成功；桌面卡牌位于报告右侧，手机卡牌入口位于报告内部，所有固定外框仍等高。

- [ ] **Step 7: 提交**

```bash
git add src/components/ShareCardPreview.vue src/App.vue src/style.css
git commit -m "feat: show share card beside report"
```
