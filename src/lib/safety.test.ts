import { describe, expect, it } from 'vitest'
import { isRiskMessage } from './safety'

describe('isRiskMessage', () => {
  it('flags an immediate self-harm phrase', () => {
    expect(isRiskMessage('我想自杀')).toBe(true)
  })

  it('does not flag an ordinary stressful message', () => {
    expect(isRiskMessage('今天工作压力很大')).toBe(false)
  })
})
