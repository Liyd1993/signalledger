import { computed, ref } from 'vue'
import { createReport } from '../lib/report'
import { isRiskMessage } from '../lib/safety'
import type { Message } from '../types'

const companionReplies = [
  '谢谢你愿意说出来。此刻最让你在意的是哪一部分？',
  '我听见了。我们不用急着解决，先把它放在这里看一看。',
  '这听起来并不轻松。你已经在认真感受自己的处境。',
]

export function createConversation() {
  const messages = ref<Message[]>([])
  const crisisActive = ref(false)
  const lastReportAt = ref(0)

  const userMessageCount = computed(() => messages.value.filter((message) => message.role === 'user' && message.kind === 'text').length)
  const unlockAt = computed(() => (lastReportAt.value === 0 ? 10 : lastReportAt.value + 5))
  const canCreateReport = computed(() => !crisisActive.value && userMessageCount.value >= unlockAt.value)

  const send = (text: string) => {
    const clean = text.trim()
    if (!clean || crisisActive.value) return

    messages.value.push({ id: crypto.randomUUID(), role: 'user', kind: 'text', text: clean })
    crisisActive.value = isRiskMessage(clean)
    if (crisisActive.value) return

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      kind: 'text',
      text: companionReplies[(userMessageCount.value - 1) % companionReplies.length],
    })
  }

  const sendImage = (imageUrl: string, fileName: string) => {
    if (!imageUrl || crisisActive.value) return
    messages.value.push({ id: crypto.randomUUID(), role: 'user', kind: 'image', imageUrl, text: fileName })
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      kind: 'text',
      text: `我收到了这张图片「${fileName}」。开发模式下，我会先把它作为你想分享的一个线索；部署后会由多模态模型结合图片内容和对话继续回应。`,
    })
  }

  const createCurrentReport = () => {
    if (!canCreateReport.value) return null
    lastReportAt.value = userMessageCount.value
    return createReport(messages.value)
  }

  return { messages, crisisActive, userMessageCount, unlockAt, canCreateReport, send, sendImage, createCurrentReport }
}
