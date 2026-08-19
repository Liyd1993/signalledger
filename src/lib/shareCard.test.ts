import { describe, expect, it } from 'vitest'
import { createShareCardContent, shareCardThemes } from './shareCard'
import type { ArchivedReport } from '../types'

const report: ArchivedReport = {
  id: 'r1',
  createdAt: '2026-08-19T00:00:00.000Z',
  summary: '工作压力',
  title: '关于工作压力的这段话',
  feelings: '你已经认真看见了这份压力，也在尝试为自己留出空间。',
  evidence: ['最近工作很多'],
  nextStep: '先休息十分钟',
  nextQuestion: '什么最消耗你？',
}

describe('createShareCardContent', () => {
  it('offers only the three approved user-selectable backgrounds', () => {
    expect(shareCardThemes.map((theme) => theme.id)).toEqual(['nouveau', 'cosmos', 'holographic'])
  })

  it('derives stable, non-diagnostic share copy', () => {
    expect(createShareCardContent(report, 'https://example.com/path')).toMatchObject({
      archetype: '缓慢复原者',
      website: 'example.com',
      keywords: ['松弛', '边界', '照顾自己'],
    })
  })

  it('keeps empathy copy within 44 Chinese characters', () => {
    const result = createShareCardContent({ ...report, feelings: '很长'.repeat(80) }, 'example.com')
    expect(result.empathy.length).toBeLessThanOrEqual(44)
    expect(result.empathy.endsWith('…')).toBe(true)
  })

  it('falls back to safe copy, three keywords, and localhost hostname', () => {
    const result = createShareCardContent({ ...report, title: '', feelings: '', nextStep: '', summary: '' }, '')
    expect(result.archetype).toBe('认真感受的人')
    expect(result.empathy).toBe('你愿意停下来听见自己，这件事本身就很重要。')
    expect(result.keywords).toEqual(['觉察', '温柔', '向前'])
    expect(result.website).toBe('127.0.0.1')
  })

  it('never emits diagnostic labels', () => {
    const result = createShareCardContent({ ...report, feelings: '你患有焦虑，你就是典型人格。' }, 'example.com')
    expect(result.empathy).not.toMatch(/患有|典型人格|你就是/)
  })
})
