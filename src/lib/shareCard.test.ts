import { describe, expect, it } from 'vitest'
import { createShareCardContent, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, shareCardThemes } from './shareCard'
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

  it('uses up to four real dialogue excerpts', () => {
    const evidence = ['第一句', '第二句', '第三句', '第四句', '第五句']
    expect(createShareCardContent(report, 'https://example.com/path')).toMatchObject({
      website: 'example.com',
      keywords: ['松弛', '边界', '照顾自己'],
    })
    const result = createShareCardContent({ ...report, evidence }, 'example.com')
    expect(result.quotes).toEqual(evidence.slice(0, 4))
    expect('archetype' in result).toBe(false)
    expect('empathy' in result).toBe(false)
  })

  it('keeps each excerpt within 38 Chinese characters', () => {
    const result = createShareCardContent({ ...report, evidence: ['很长'.repeat(80)] }, 'example.com')
    expect(result.quotes[0].length).toBeLessThanOrEqual(38)
    expect(result.quotes[0].endsWith('…')).toBe(true)
  })

  it('falls back to report copy, three keywords, and localhost hostname', () => {
    const result = createShareCardContent({ ...report, evidence: [], title: '', feelings: '', nextStep: '', summary: '' }, '')
    expect(result.quotes).toEqual(['这一刻，我愿意听见自己的感受。'])
    expect(result.keywords).toEqual(['觉察', '温柔', '向前'])
    expect(result.website).toBe('127.0.0.1')
  })

  it('exports the approved 9:16 dimensions', () => {
    expect([SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT]).toEqual([1080, 1920])
  })
})
