import { describe, expect, it } from 'vitest'
import { ambientTracks, createWav } from './audio'

describe('ambient audio', () => {
  it('has five selectable original noise tracks', () => expect(ambientTracks).toHaveLength(5))
  it('creates a wav blob', async () => {
    const bytes = new Uint8Array(await createWav(ambientTracks[0], 1).arrayBuffer())
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE')
  })
})
