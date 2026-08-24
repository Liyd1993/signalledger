import type { ArchivedReport } from '../types'

export type ShareCardTheme = 'nouveau' | 'cosmos' | 'holographic'

export type ShareCardContent = {
  quotes: string[]
  keywords: [string, string, string]
  date: string
  website: string
}

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1920

export const shareCardThemes: { id: ShareCardTheme; label: string; asset: string }[] = [
  { id: 'nouveau', label: '新艺术晨光', asset: '/cards/art-nouveau-dawn.webp' },
  { id: 'cosmos', label: '金线星图', asset: '/cards/gilded-cosmos.webp' },
  { id: 'holographic', label: '虹光秘仪', asset: '/cards/holographic-arcana.webp' },
]

const fallbackQuote = '这一刻，我愿意听见自己的感受。'

function hostnameFrom(value: string) {
  const raw = value.trim()
  if (!raw) return '127.0.0.1'
  try { return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname || '127.0.0.1' }
  catch { return raw.split(/[/:]/)[0] || '127.0.0.1' }
}

function truncateQuote(text: string, max = 38) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean || fallbackQuote
  return `${clean.slice(0, max - 1)}…`
}

function dialogueQuotes(report: ArchivedReport) {
  const source = report.evidence.length
    ? report.evidence
    : [report.summary || report.feelings || fallbackQuote]
  return source.filter(Boolean).slice(0, 4).map((text) => truncateQuote(text))
}

function deriveKeywords(source: string): [string, string, string] {
  const found: string[] = []
  const add = (...values: string[]) => values.forEach((value) => !found.includes(value) && found.push(value))
  if (/工作|压力|疲惫|累/.test(source)) add('松弛', '边界')
  if (/自己|空间|休息|睡/.test(source)) add('照顾自己')
  if (/关系|家人|委屈/.test(source)) add('连接', '理解')
  if (/拒绝|边界/.test(source)) add('边界', '坚定')
  if (/改变|开始|行动|尝试/.test(source)) add('勇气', '行动')
  if (/表达|感受|说/.test(source)) add('真诚', '觉察')
  add('觉察', '温柔', '向前')
  return found.slice(0, 3) as [string, string, string]
}

export function createShareCardContent(report: ArchivedReport, hostname: string): ShareCardContent {
  const source = [report.title, report.summary, report.feelings, report.nextStep, ...report.evidence].filter(Boolean).join(' ')
  return {
    quotes: dialogueQuotes(report),
    keywords: deriveKeywords(source),
    date: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(report.createdAt)),
    website: hostnameFrom(hostname),
  }
}

type Palette = { top: string; bottom: string; ink: string; muted: string; accent: string }

const palettes: Record<ShareCardTheme, Palette> = {
  nouveau: { top: '#f7eee2', bottom: '#cfe9df', ink: '#5c4c44', muted: '#75665e', accent: '#9a7046' },
  cosmos: { top: '#121412', bottom: '#24231f', ink: '#f6ecd4', muted: '#d2c5a7', accent: '#d3b171' },
  holographic: { top: '#101923', bottom: '#202b35', ink: '#f8fbff', muted: '#d1deea', accent: '#84e5ef' },
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.closePath()
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = []; let line = ''
  for (const char of text) {
    const next = line + char
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = char }
    else line = next
    if (lines.length === maxLines) break
  }
  if (lines.length < maxLines && line) lines.push(line)
  return lines.slice(0, maxLines)
}

function drawCover(ctx: CanvasRenderingContext2D, image: CanvasImageSource, width: number, height: number) {
  ctx.drawImage(image, 0, 0, width, height)
}

export function drawShareCard(canvas: HTMLCanvasElement, content: ShareCardContent, theme: ShareCardTheme, background?: CanvasImageSource) {
  const width = SHARE_CARD_WIDTH; const height = SHARE_CARD_HEIGHT; const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器无法生成图片')
  const palette = palettes[theme]; canvas.width = width; canvas.height = height
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette.top); gradient.addColorStop(1, palette.bottom)
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height)
  if (background) { ctx.save(); ctx.globalAlpha = theme === 'nouveau' ? .9 : .92; drawCover(ctx, background, width, height); ctx.restore() }

  ctx.strokeStyle = palette.accent; ctx.lineWidth = 4
  roundedRect(ctx, 58, 58, width - 116, height - 116, 42); ctx.stroke()

  ctx.textAlign = 'center'; ctx.fillStyle = palette.accent; ctx.font = '700 30px system-ui, sans-serif'
  ctx.fillText(`ECHO CARD  ·  ${content.date}`, width / 2, 150)
  ctx.font = '700 26px system-ui, sans-serif'; ctx.fillText('O U R   W O R D S', width / 2, 640)
  ctx.fillStyle = palette.ink; ctx.font = `${theme === 'nouveau' ? 700 : 800} 76px system-ui, sans-serif`
  ctx.fillText('我们的话语', width / 2, 730)

  ctx.fillStyle = palette.ink; ctx.font = `${theme === 'nouveau' ? 500 : 600} 44px system-ui, sans-serif`
  content.quotes.forEach((quote, index) => {
    const y = 900 + index * 185
    wrapLines(ctx, quote, 800, 2).forEach((line, lineIndex) => ctx.fillText(line, width / 2, y + lineIndex * 60))
    if (index < content.quotes.length - 1) {
      ctx.save(); ctx.globalAlpha = .48; ctx.strokeStyle = palette.accent; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(330, y + 118); ctx.lineTo(750, y + 118); ctx.stroke(); ctx.restore()
    }
  })

  ctx.font = '600 30px system-ui, sans-serif'
  content.keywords.forEach((keyword, index) => {
    const x = 270 + index * 270
    ctx.fillStyle = palette.accent; ctx.beginPath(); ctx.arc(x, 1668, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = palette.muted; ctx.fillText(keyword, x, 1724)
  })

  ctx.fillStyle = palette.muted; ctx.font = '500 26px system-ui, sans-serif'
  ctx.fillText('基于一次真实表达生成 · 非医疗建议', width / 2, 1778)
  ctx.fillStyle = palette.ink; ctx.font = '700 30px system-ui, sans-serif'
  ctx.fillText(`EchoReport · ${content.website}`, width / 2, 1830)
  return canvas
}

export async function loadShareCardImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('卡牌背景加载失败')); image.src = src
  })
}

export async function downloadShareCard(report: ArchivedReport, theme: ShareCardTheme, hostname: string) {
  const asset = shareCardThemes.find((item) => item.id === theme)?.asset
  const image = asset ? await loadShareCardImage(asset).catch(() => undefined) : undefined
  const canvas = drawShareCard(document.createElement('canvas'), createShareCardContent(report, hostname), theme, image)
  const link = document.createElement('a')
  link.download = `echoreport-${theme}-${report.createdAt.slice(0, 10)}.png`
  link.href = canvas.toDataURL('image/png'); link.click()
}
