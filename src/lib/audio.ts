export type NoiseKind = 'rain' | 'ocean' | 'stream' | 'forest' | 'brown'
export type AmbientTrack = { id: NoiseKind; title: string; subtitle: string; kind: NoiseKind; src?: string }

export const ambientTracks: AmbientTrack[] = [
  { id: 'rain', title: '窗前细雨', subtitle: '真实雨声 · 0:57', kind: 'rain', src: '/audio/rain-long-loop.mp3' },
  { id: 'ocean', title: '远岸海浪', subtitle: '真实海浪 · 0:28', kind: 'ocean', src: '/audio/close-sea-waves.mp3' },
  { id: 'stream', title: '林间溪流', subtitle: '真实流水 · 0:51', kind: 'stream', src: '/audio/flowing-water.mp3' },
  { id: 'forest', title: '森林清晨', subtitle: '流水与鸟鸣 · 0:48', kind: 'forest', src: '/audio/forest-water-birds.mp3' },
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
  if (kind === 'forest') return noise * .065
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
