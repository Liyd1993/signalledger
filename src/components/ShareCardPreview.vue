<script setup lang="ts">
import type { ShareCardContent, ShareCardTheme } from '../lib/shareCard'

withDefaults(defineProps<{
  content: ShareCardContent
  theme: ShareCardTheme
  asset: string
  siteLink?: boolean
  siteHref?: string
}>(), { siteLink: true, siteHref: '/' })
</script>

<template>
  <article class="share-card-preview" :class="`theme-${theme}`">
    <img class="share-card-art" :src="asset" alt="" />
    <div class="share-card-frame">
      <div class="share-card-meta"><span>ECHO CARD</span><time>{{ content.date }}</time></div>
      <div class="share-card-copy"><small>MY INNER NOTE</small><h2>{{ content.archetype }}</h2><p>“{{ content.empathy }}”</p></div>
      <ul class="share-card-keywords"><li v-for="keyword in content.keywords" :key="keyword">{{ keyword }}</li></ul>
      <footer>
        <small>基于一次真实表达生成 · 非医疗建议</small>
        <a v-if="siteLink" :href="siteHref" target="_blank" rel="noreferrer">EchoReport · {{ content.website }}</a>
        <span v-else class="share-card-site">EchoReport · {{ content.website }}</span>
      </footer>
    </div>
  </article>
</template>
