export type NoiseKind = 'rain' | 'ocean' | 'fan' | 'stream' | 'brown'
export type AmbientTrack = { id: NoiseKind; title: string; subtitle: string; kind: NoiseKind }

export const ambientTracks: AmbientTrack[] = [
  { id: 'rain', title: '窗前细雨', subtitle: '细密雨声 · 白噪音', kind: 'rain' },
  { id: 'ocean', title: '远岸海浪', subtitle: '缓慢潮汐 · 粉红噪音', kind: 'ocean' },
  { id: 'fan', title: '深夜风扇', subtitle: '稳定气流 · 白噪音', kind: 'fan' },
  { id: 'stream', title: '林间溪流', subtitle: '流动水声 · 自然噪音', kind: 'stream' },
  { id: 'brown', title: '布朗噪音', subtitle: '低频柔和 · 布朗噪音', kind: 'brown' },
]

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index))
}

function pseudoNoise(index: number) { return (Math.sin(index * 12.9898) * 43758.5453 % 1) * 2 - 1 }

function sample(kind: NoiseKind, index: number, time: number, brown: { value: number }) {
  const noise = pseudoNoise(index)
  if (kind === 'brown') { brown.value = (brown.value + noise * .025) * .985; return brown.value * .7 }
  if (kind === 'ocean') { brown.value = (brown.value + noise * .018) * .988; return brown.value * (.27 + .2 * Math.sin(time * .65)) }
  if (kind === 'fan') return noise * .075 + Math.sin(2 * Math.PI * 96 * time) * .035 + Math.sin(2 * Math.PI * 192 * time) * .015
  if (kind === 'stream') return noise * (.07 + .035 * Math.sin(time * 3.3)) + Math.sin(2 * Math.PI * 410 * time) * .009
  return noise * (.055 + .045 * Math.max(0, Math.sin(time * 7.1)))
}

export function createWav(track: AmbientTrack, seconds = 18): Blob {
  const sampleRate = 8000
  const sampleCount = sampleRate * seconds
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + sampleCount * 2, true); writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  writeString(view, 36, 'data'); view.setUint32(40, sampleCount * 2, true)
  const brown = { value: 0 }
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    const edge = Math.min(time * 2, 1) * Math.min((seconds - time) * 2, 1)
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample(track.kind, index, time, brown) * edge)) * 32767, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
