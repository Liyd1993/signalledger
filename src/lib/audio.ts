export type AmbientTrack = { id: string; title: string; subtitle: string; frequency: number; kind: 'tone' | 'noise' }

export const ambientTracks: AmbientTrack[] = [
  { id: 'rain', title: '细雨窗边', subtitle: '轻柔颗粒声 · 0:12', frequency: 0, kind: 'noise' },
  { id: 'breathe', title: '缓慢呼吸', subtitle: '低频起伏 · 0:12', frequency: 174, kind: 'tone' },
  { id: 'harbor', title: '港湾余音', subtitle: '温和和弦 · 0:12', frequency: 220, kind: 'tone' },
]

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index))
}

export function createWav(track: AmbientTrack, seconds = 12): Blob {
  const sampleRate = 8000
  const sampleCount = sampleRate * seconds
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + sampleCount * 2, true); writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  writeString(view, 36, 'data'); view.setUint32(40, sampleCount * 2, true)
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    const envelope = Math.min(time * 2, 1) * Math.min((seconds - time) * 2, 1)
    const value = track.kind === 'noise'
      ? (Math.sin(index * 12.9898) * 43758.5453 % 1) * 0.14
      : (Math.sin(2 * Math.PI * track.frequency * time) + Math.sin(2 * Math.PI * track.frequency * 1.5 * time) * 0.22) * (0.1 + 0.04 * Math.sin(time * 0.7))
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, value * envelope)) * 32767, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
