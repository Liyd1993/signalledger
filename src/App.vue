<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { createConversation } from './stores/conversation'
import type { ReflectionReport } from './types'

const conversation = createConversation()
const { messages, crisisActive, userMessageCount, unlockAt, canCreateReport } = conversation
const draft = ref('')
const report = ref<ReflectionReport | null>(null)
const transcript = ref<HTMLElement | null>(null)
const pendingImage = ref<string | null>(null)
const pendingImageName = ref('')
const messagesToReport = computed(() => Math.max(unlockAt.value - userMessageCount.value, 0))

function send() {
  conversation.send(draft.value)
  draft.value = ''
}

function openReport() {
  report.value = conversation.createCurrentReport()
}

function selectImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    pendingImage.value = String(reader.result)
    pendingImageName.value = file.name
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function sendImage() {
  if (!pendingImage.value) return
  conversation.sendImage(pendingImage.value, pendingImageName.value)
  pendingImage.value = null
  pendingImageName.value = ''
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    transcript.value?.scrollTo({ top: transcript.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <main class="app-shell">
    <section v-if="!report" class="conversation-card" aria-label="对话">
      <header class="hero">
        <div class="mark" aria-hidden="true">✦</div>
        <p class="eyebrow">EchoReport</p>
        <h1>把现在的心情，<br />慢慢说出来</h1>
        <p class="subhead">这是一次非医疗的自我反思对话。</p>
      </header>

      <div class="progress-card">
        <div>
          <span>对话进度</span>
          <strong>{{ userMessageCount }} <small>/ 10</small></strong>
        </div>
        <p v-if="messagesToReport > 0">再写 {{ messagesToReport }} 段表达，即可生成专属报告</p>
        <p v-else>你已积累足够的表达，可以生成一份回顾报告。</p>
      </div>

      <div ref="transcript" class="transcript" aria-live="polite">
        <p v-if="messages.length === 0" class="empty-state">从此刻最想说的一件小事开始也可以。</p>
        <div v-for="message in messages" :key="message.id" class="message" :class="message.role">
          <img v-if="message.kind === 'image' && message.imageUrl" :src="message.imageUrl" :alt="message.text || '用户上传的图片'" />
          <template v-else>{{ message.text }}</template>
        </div>
      </div>

      <aside v-if="crisisActive" class="crisis-card" role="alert">
        <span aria-hidden="true">✦</span>
        <div>
          <strong>你现在的安全最重要</strong>
          <p>请优先联系身边可信任的人、当地紧急服务，或中国心理援助热线 12356。</p>
        </div>
      </aside>

      <button v-else-if="canCreateReport" class="report-cta" type="button" @click="openReport">
        <span>✦</span> 生成我的专属报告
      </button>

      <div v-if="pendingImage" class="image-preview">
        <img :src="pendingImage" :alt="pendingImageName" />
        <span>{{ pendingImageName }}</span>
        <button type="button" class="text-button" @click="pendingImage = null">移除</button>
        <button type="button" class="send-image" @click="sendImage">发送图片</button>
      </div>

      <form v-if="!crisisActive" class="composer" @submit.prevent="send">
        <label class="image-picker" title="添加图片">
          <span aria-hidden="true">＋</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" @change="selectImage" />
        </label>
        <input v-model="draft" aria-label="输入想说的话" maxlength="200" placeholder="想从哪里开始说？" />
        <button type="submit" :disabled="!draft.trim()">发送</button>
      </form>
    </section>

    <section v-else class="report-card" aria-label="专属报告">
      <button class="back-button" type="button" @click="report = null">← 回到对话</button>
      <div class="report-hero">
        <p class="eyebrow">YOUR REFLECTION</p>
        <span aria-hidden="true">✦</span>
        <h1>{{ report.title }}</h1>
        <p>这份报告只依据你刚才的表达生成。</p>
      </div>

      <article class="report-section"><h2>你表达出的感受</h2><p>{{ report.feelings }}</p></article>
      <article class="report-section evidence"><h2>对话里的线索</h2><blockquote v-for="line in report.evidence" :key="line">“{{ line }}”</blockquote></article>
      <article class="report-section"><h2>可以尝试的一小步</h2><p>{{ report.nextStep }}</p></article>
      <article class="report-section"><h2>下次可以继续聊</h2><p>{{ report.nextQuestion }}</p></article>

      <p class="report-disclaimer">这不是诊断、治疗或紧急服务。需要帮助时，请联系专业服务或可信任的人。</p>
    </section>
  </main>
</template>
