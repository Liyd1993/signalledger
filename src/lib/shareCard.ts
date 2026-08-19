import type { ArchivedReport } from '../types'

export type ShareCardTheme = 'holographic' | 'minimal' | 'nouveau' | 'cosmos'

export type ShareCardContent = {
  archetype: string
  empathy: string
  keywords: [string, string, string]
  date: string
  website: string
}

export const shareCardThemes: { id: ShareCardTheme; label: string; asset: string }[] = [
  { id: 'holographic', label: '虹光秘仪', asset: '/cards/holographic-arcana.webp' },
  { id: 'minimal', label: '纯黑极简', asset: '/cards/black-minimal.webp' },
  { id: 'nouveau', label: '新艺术晨光', asset: '/cards/art-nouveau-dawn.webp' },
  { id: 'cosmos', label: '金线星图', asset: '/cards/gilded-cosmos.webp' },
]

const fallbackEmpathy = '你愿意停下来听见自己，这件事本身就很重要。'
const forbiddenLabels = /你患有|你就是|典型人格|心理疾病|精神疾病/

function hostnameFrom(value: string) {
  const raw = value.trim()
  if (!raw) return '127.0.0.1'
  try { return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname || '127.0.0.1' }
  catch { return raw.split(/[/:]/)[0] || '127.0.0.1' }
}

function truncate(text: string, max = 44) {
  const clean = text.replace(/\s+/g, '').trim()
  if (forbiddenLabels.test(clean)) return fallbackEmpathy
  if (clean.length <= max) return clean || fallbackEmpathy
  return `${clean.slice(0, max - 1)}…`
}

function deriveArchetype(source: string) {
  if (/工作|压力|疲惫|累|休息|睡|空间/.test(source)) return '缓慢复原者'
  if (/关系|家人|边界|拒绝|委屈/.test(source)) return '边界守望者'
  if (/改变|开始|行动|尝试|决定/.test(source)) return '微光行动者'
  if (/表达|理解|感受|说出来/.test(source)) return '真诚表达者'
  return '认真感受的人'
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
  const source = [report.title, report.summary, report.feelings, report.nextStep].filter(Boolean).join(' ')
  return {
    archetype: deriveArchetype(source),
    empathy: truncate(report.feelings),
    keywords: deriveKeywords(source),
    date: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(report.createdAt)),
    website: hostnameFrom(hostname),
  }
}

type Palette = { top: string; bottom: string; ink: string; muted: string; accent: string; panel: string }

const palettes: Record<ShareCardTheme, Palette> = {
  holographic: { top: '#101923', bottom: '#202b35', ink: '#f8fbff', muted: '#d1deea', accent: '#84e5ef', panel: 'rgba(10,18,27,.72)' },
  minimal: { top: '#050608', bottom: '#17181c', ink: '#ffffff', muted: '#c8c8cc', accent: '#ece3cf', panel: 'rgba(0,0,0,.58)' },
  nouveau: { top: '#f7eee2', bottom: '#cfe9df', ink: '#392d2d', muted: '#655a55', accent: '#9a7046', panel: 'rgba(255,250,244,.78)' },
  cosmos: { top: '#121412', bottom: '#24231f', ink: '#f6ecd4', muted: '#d2c5a7', accent: '#d3b171', panel: 'rgba(13,14,12,.7)' },
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
  const sourceWidth = Number((image as { naturalWidth?: number; width?: number }).naturalWidth ?? (image as { width?: number }).width ?? width)
  const sourceHeight = Number((image as { naturalHeight?: number; height?: number }).naturalHeight ?? (image as { height?: number }).height ?? height)
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale; const drawHeight = sourceHeight * scale
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

export function drawShareCard(canvas: HTMLCanvasElement, content: ShareCardContent, theme: ShareCardTheme, background?: CanvasImageSource) {
  const width = 1080; const height = 1440; const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器无法生成图片')
  const palette = palettes[theme]; canvas.width = width; canvas.height = height
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette.top); gradient.addColorStop(1, palette.bottom)
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height)
  if (background) { ctx.save(); ctx.globalAlpha = theme === 'nouveau' ? .68 : .78; drawCover(ctx, background, width, height); ctx.restore() }

  ctx.strokeStyle = palette.accent; ctx.lineWidth = 4
  roundedRect(ctx, 58, 58, width - 116, height - 116, 42); ctx.stroke()
  ctx.fillStyle = palette.panel; roundedRect(ctx, 122, 340, width - 244, 720, 36); ctx.fill()

  ctx.textAlign = 'center'; ctx.fillStyle = palette.accent; ctx.font = '700 30px system-ui, sans-serif'
  ctx.fillText(`ECHO CARD  ·  ${content.date}`, width / 2, 150)
  ctx.fillStyle = palette.ink; ctx.font = '800 82px system-ui, sans-serif'
  ctx.fillText(content.archetype, width / 2, 500)
  ctx.fillStyle = palette.accent; ctx.font = '500 28px system-ui, sans-serif'; ctx.fillText('✦  MY INNER NOTE  ✦', width / 2, 566)

  ctx.fillStyle = palette.ink; ctx.font = '600 46px system-ui, sans-serif'
  wrapLines(ctx, content.empathy, 690, 4).forEach((line, index) => ctx.fillText(line, width / 2, 690 + index * 68))

  ctx.font = '600 30px system-ui, sans-serif'
  content.keywords.forEach((keyword, index) => {
    const x = 270 + index * 270
    ctx.fillStyle = palette.accent; ctx.beginPath(); ctx.arc(x, 974, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = palette.muted; ctx.fillText(keyword, x, 1030)
  })

  ctx.fillStyle = palette.muted; ctx.font = '500 26px system-ui, sans-serif'
  ctx.fillText('基于一次真实表达生成 · 非医疗建议', width / 2, 1244)
  ctx.fillStyle = palette.ink; ctx.font = '700 30px system-ui, sans-serif'
  ctx.fillText(`EchoReport · ${content.website}`, width / 2, 1304)
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
