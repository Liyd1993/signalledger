<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ambientTracks, createWav, type AmbientTrack } from './lib/audio'
import { archiveReport, loadReports } from './lib/reportArchive'
import { createShareCardContent, downloadShareCard, shareCardThemes, type ShareCardTheme } from './lib/shareCard'
import { createConversation } from './stores/conversation'
import type { ArchivedReport, ReflectionReport } from './types'

type Page = 'home' | 'chat' | 'reports' | 'cards' | 'audio'
const page = ref<Page>('home')
const conversation = createConversation()
const { messages, crisisActive, userMessageCount, unlockAt, canCreateReport } = conversation
const draft = ref('')
const report = ref<ReflectionReport | ArchivedReport | null>(null)
const reports = ref<ArchivedReport[]>(loadReports())
const cardReport = ref<ArchivedReport | null>(null)
const cardTheme = ref<ShareCardTheme>('holographic')
const isExporting = ref(false)
const exportError = ref('')
const siteOrigin = window.location.origin
const transcript = ref<HTMLElement | null>(null)
const conversationIntro = ref<HTMLElement | null>(null)
const pendingImage = ref<string | null>(null)
const pendingImageName = ref('')
const selectedTrack = ref<AmbientTrack>(ambientTracks[0])
const audioUrl = ref('')
const audioPlayer = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(18)
const messagesToReport = computed(() => Math.max(unlockAt.value - userMessageCount.value, 0))
const cardContent = computed(() => cardReport.value ? createShareCardContent(cardReport.value, window.location.hostname) : null)
const selectedCardTheme = computed(() => shareCardThemes.find((theme) => theme.id === cardTheme.value) ?? shareCardThemes[0])
const introShift = ref(0)

function go(next: Page) { report.value = null; cardReport.value = null; page.value = next }
function send() { conversation.send(draft.value); draft.value = '' }
function openReport() {
  const created = conversation.createCurrentReport()
  if (!created) return
  report.value = archiveReport(created); reports.value = loadReports()
}
function showReport(item: ArchivedReport) { report.value = item }
function openCards(item: ArchivedReport) {
  report.value = null; cardReport.value = item; cardTheme.value = 'holographic'; exportError.value = ''; page.value = 'cards'
}
async function exportCard() {
  if (!cardReport.value || isExporting.value) return
  isExporting.value = true; exportError.value = ''
  try { await downloadShareCard(cardReport.value, cardTheme.value, window.location.hostname) }
  catch { exportError.value = '图片生成失败，请稍后再试。' }
  finally { isExporting.value = false }
}
function selectImage(event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { pendingImage.value = String(reader.result); pendingImageName.value = file.name }
  reader.readAsDataURL(file); input.value = ''
}
function sendImage() {
  if (!pendingImage.value) return
  conversation.sendImage(pendingImage.value, pendingImageName.value)
  pendingImage.value = null; pendingImageName.value = ''
}
function selectTrack(track: AmbientTrack) {
  audioPlayer.value?.pause()
  if (audioUrl.value.startsWith('blob:')) URL.revokeObjectURL(audioUrl.value)
  selectedTrack.value = track; audioUrl.value = track.src ?? URL.createObjectURL(createWav(track)); currentTime.value = 0; isPlaying.value = false
}
function togglePlayback() { if (!audioPlayer.value) return; isPlaying.value ? audioPlayer.value.pause() : audioPlayer.value.play() }
function formatTime(value: number) { const seconds = Math.floor(value || 0); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
function scrollTranscript(event: WheelEvent) {
  if (transcript.value) transcript.value.scrollTop += event.deltaY
}
watch(() => messages.value.length, async () => {
  await nextTick()
  const messageNodes = [...(transcript.value?.querySelectorAll<HTMLElement>('.message') ?? [])]
  const messageStack = transcript.value?.querySelector<HTMLElement>('.message-stack')
  const rowGap = Number.parseFloat(messageStack ? getComputedStyle(messageStack).rowGap : '0') || 0
  const messageHeight = messageNodes.reduce((total, node) => total + node.offsetHeight, 0) + Math.max(messageNodes.length - 1, 0) * rowGap
  const introLimit = conversationIntro.value ? conversationIntro.value.offsetTop + conversationIntro.value.offsetHeight : 0
  introShift.value = Math.min(messageHeight, introLimit)
  transcript.value?.scrollTo({ top: transcript.value.scrollHeight, behavior: 'smooth' })
})
onBeforeUnmount(() => { if (audioUrl.value.startsWith('blob:')) URL.revokeObjectURL(audioUrl.value) })
selectTrack(selectedTrack.value)
</script>

<template>
  <main class="app-shell">
    <section v-if="page === 'home'" class="home-card" aria-label="首页">
      <header class="home-hero"><p class="eyebrow">ECHO REPORT</p><span>◎</span><h1>今天，想给自己<br />一点什么？</h1><p>一个非医疗的自我反思空间。</p></header>
      <div class="home-grid">
        <button class="home-action talk" type="button" @click="go('chat')"><span>✦</span><strong>说给我听</strong><small>从此刻开始对话</small></button>
        <button class="home-action report-link" type="button" @click="go('reports')"><span>▤</span><strong>看看变化</strong><small>{{ reports.length ? `${reports.length} 份报告` : '回顾你的表达' }}</small></button>
        <button class="home-action audio-link" type="button" @click="go('audio')"><span>◖</span><strong>听一会儿</strong><small>原创环境声音</small></button>
      </div><p class="home-note">不需要组织得很好。说出一个片段，也可以。</p>
    </section>

    <section v-else-if="page === 'chat' && !report" class="conversation-card" aria-label="对话" @wheel.prevent="scrollTranscript">
      <button class="back-button" type="button" @click="go('home')">← 返回首页</button>
      <div ref="conversationIntro" class="conversation-intro" :style="{ transform: `translateY(-${introShift}px)` }">
        <header class="hero"><div class="mark">✦</div><p class="eyebrow">ECHO REPORT</p><h1>把现在的心情，<br />慢慢说出来</h1><p class="subhead">这是一次非医疗的自我反思对话。</p></header>
        <div class="progress-card"><div><span>对话进度</span><strong>{{ userMessageCount }} <small>/ 10</small></strong></div><p v-if="messagesToReport">再写 {{ messagesToReport }} 段表达，即可生成专属报告</p><p v-else>你已积累足够的表达，可以生成一份回顾报告。</p></div>
      </div>
      <div ref="transcript" class="transcript" :class="{ 'has-report-cta': canCreateReport && !crisisActive }" aria-live="polite"><div class="message-stack"><p v-if="!messages.length" class="empty-state">从此刻最想说的一件小事开始也可以。</p><div v-for="message in messages" :key="message.id" class="message" :class="message.role"><img v-if="message.kind === 'image' && message.imageUrl" :src="message.imageUrl" :alt="message.text || '用户上传的图片'" /><template v-else>{{ message.text }}</template></div></div></div>
      <aside v-if="crisisActive" class="crisis-card" role="alert"><span>✦</span><div><strong>你现在的安全最重要</strong><p>请优先联系身边可信任的人、当地紧急服务，或中国心理援助热线 12356。</p></div></aside>
      <button v-else-if="canCreateReport" class="report-cta" type="button" @click="openReport"><span>✦</span> 生成我的专属报告</button>
      <div v-if="pendingImage" class="image-preview"><img :src="pendingImage" :alt="pendingImageName" /><span>{{ pendingImageName }}</span><button type="button" class="text-button" @click="pendingImage = null">移除</button><button type="button" class="send-image" @click="sendImage">发送图片</button></div>
      <form v-if="!crisisActive" class="composer" @submit.prevent="send"><label class="image-picker" title="添加图片"><span>＋</span><input type="file" accept="image/png,image/jpeg,image/webp" @change="selectImage" /></label><input v-model="draft" aria-label="输入想说的话" maxlength="200" placeholder="想从哪里开始说？" /><button type="submit" :disabled="!draft.trim()">发送</button></form>
    </section>

    <section v-else-if="page === 'reports' && !report" class="list-card" aria-label="全部报告">
      <button class="back-button" type="button" @click="go('home')">← 返回首页</button>
      <header class="page-title"><p class="eyebrow">YOUR ARCHIVE</p><h1>我的报告</h1><p>每一份都是一次对刚才表达的回顾。</p></header>
      <div v-if="!reports.length" class="empty-archive"><span>✦</span><h2>这里还没有报告</h2><p>完成 10 段文字表达后，就能生成第一份回顾。</p><button class="small-cta" type="button" @click="go('chat')">开始对话</button></div>
      <article v-for="item in reports" v-else :key="item.id" class="archive-item">
        <div class="archive-copy"><span>{{ new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}</span><strong>{{ item.title }}</strong><small>{{ item.summary }}</small></div>
        <div class="archive-actions"><button type="button" :aria-label="`查看报告：${item.title}`" @click="showReport(item)">查看报告</button><button class="make-card" type="button" :aria-label="`为报告生成卡牌：${item.title}`" @click="openCards(item)">生成卡牌 ✦</button></div>
      </article>
    </section>

    <section v-else-if="page === 'cards' && cardReport && cardContent" class="card-studio" aria-label="我的卡牌">
      <button class="back-button" type="button" @click="go('reports')">← 回到报告列表</button>
      <header class="page-title card-title"><p class="eyebrow">SHARE YOUR NOTE</p><h1>我的卡牌</h1><p>同一份心情，试试四种表达。</p></header>
      <article class="share-card-preview" :class="`theme-${cardTheme}`">
        <img class="share-card-art" :src="selectedCardTheme.asset" alt="" />
        <div class="share-card-frame">
          <div class="share-card-meta"><span>ECHO CARD</span><time>{{ cardContent.date }}</time></div>
          <div class="share-card-copy"><small>MY INNER NOTE</small><h2>{{ cardContent.archetype }}</h2><p>“{{ cardContent.empathy }}”</p></div>
          <ul class="share-card-keywords"><li v-for="keyword in cardContent.keywords" :key="keyword">{{ keyword }}</li></ul>
          <footer><small>基于一次真实表达生成 · 非医疗建议</small><a :href="siteOrigin" target="_blank" rel="noreferrer">EchoReport · {{ cardContent.website }}</a></footer>
        </div>
      </article>
      <div class="theme-picker" role="group" aria-label="选择卡牌样式"><button v-for="theme in shareCardThemes" :key="theme.id" type="button" :class="[{ active: theme.id === cardTheme }, `theme-choice-${theme.id}`]" :aria-pressed="theme.id === cardTheme" @click="cardTheme = theme.id"><span></span>{{ theme.label }}</button></div>
      <button class="download-card" type="button" :disabled="isExporting" @click="exportCard">{{ isExporting ? '正在生成图片…' : '下载 3:4 PNG' }}</button>
      <p v-if="exportError" class="export-error" role="alert">{{ exportError }}</p>
    </section>

    <section v-else-if="page === 'audio'" class="audio-card" aria-label="声音陪伴">
      <button class="back-button" type="button" @click="go('home')">← 返回首页</button>
      <header class="page-title"><p class="eyebrow">SOUND LIBRARY</p><h1>白噪音声景</h1><p>为此刻挑一段持续、无歌词的声音。</p></header>
      <div class="sound-cover" :class="selectedTrack.id"><span>{{ selectedTrack.id === 'rain' ? '☂' : selectedTrack.id === 'ocean' ? '◒' : selectedTrack.id === 'stream' ? '≈' : selectedTrack.id === 'forest' ? '♧' : '◉' }}</span><small>正在播放</small><strong>{{ selectedTrack.title }}</strong><p>{{ selectedTrack.subtitle }}</p></div>
      <audio v-if="audioUrl" ref="audioPlayer" :src="audioUrl" loop preload="metadata" @play="isPlaying = true" @pause="isPlaying = false" @ended="isPlaying = false" @loadedmetadata="duration = audioPlayer?.duration || 18" @timeupdate="currentTime = audioPlayer?.currentTime || 0">你的浏览器暂不支持音频播放。</audio>
      <div class="player-controls"><button class="play-button" type="button" :aria-label="isPlaying ? '暂停' : '播放'" @click="togglePlayback">{{ isPlaying ? 'Ⅱ' : '▶' }}</button><span>{{ formatTime(currentTime) }}</span><input v-model.number="currentTime" type="range" min="0" :max="duration || 18" step="0.1" aria-label="播放进度" @input="audioPlayer && (audioPlayer.currentTime = currentTime)" /><span>{{ formatTime(duration) }}</span></div>
      <div class="track-list"><button v-for="track in ambientTracks" :key="track.id" type="button" :class="{ active: track.id === selectedTrack.id }" @click="selectTrack(track)"><span>{{ track.id === 'rain' ? '☂' : track.id === 'ocean' ? '◒' : track.id === 'stream' ? '≈' : track.id === 'forest' ? '♧' : '◉' }}</span><div><strong>{{ track.title }}</strong><small>{{ track.subtitle }}</small></div><b>{{ track.id === selectedTrack.id ? '正在选择' : '选择' }}</b></button></div><p class="audio-disclaimer">声音用于陪伴与放松，不替代医疗、心理治疗或紧急支持。</p>
    </section>

    <section v-else class="report-card" aria-label="专属报告"><button class="back-button" type="button" @click="report = null; page = 'reports'">← 回到报告列表</button><div class="report-hero"><p class="eyebrow">YOUR REFLECTION</p><span>✦</span><h1>{{ report?.title }}</h1><p>这份报告只依据你刚才的表达生成。</p></div><article class="report-section"><h2>你表达出的感受</h2><p>{{ report?.feelings }}</p></article><article class="report-section evidence"><h2>对话里的线索</h2><blockquote v-for="line in report?.evidence" :key="line">“{{ line }}”</blockquote></article><article class="report-section"><h2>可以尝试的一小步</h2><p>{{ report?.nextStep }}</p></article><article class="report-section"><h2>下次可以继续聊</h2><p>{{ report?.nextQuestion }}</p></article><p class="report-disclaimer">这不是诊断、治疗或紧急服务。需要帮助时，请联系专业服务或可信任的人。</p></section>
  </main>
</template>
