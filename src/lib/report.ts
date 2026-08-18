import type { Message, ReflectionReport } from '../types'

function chooseTitle(text: string) {
  if (text.includes('汇报')) return '关于汇报的这段话'
  if (text.includes('工作')) return '关于工作压力的这段话'
  if (text.includes('关系') || text.includes('家')) return '关于关系里的感受'
  if (text.includes('累') || text.includes('睡')) return '想为自己留一点空间'
  return '这一段想慢慢说的话'
}

export function createReport(messages: Message[]): ReflectionReport {
  const evidence = messages
    .filter((message) => message.role === 'user' && message.kind === 'text')
    .map((message) => message.text ?? '')
    .filter(Boolean)
    .slice(-3)
  const source = evidence.join(' ')

  return {
    title: chooseTitle(source),
    feelings: '从这段对话看，你也许正带着一些需要被安放的压力。能把它说出来，本身已经是在照顾自己。',
    evidence,
    nextStep: '如果愿意，先用两分钟写下：此刻最希望有人理解的一件事。写完就可以停下。',
    nextQuestion: '这件事里，哪一部分最消耗你，也最值得被温柔对待？',
  }
}
