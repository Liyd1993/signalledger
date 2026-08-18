import { describe, expect, it } from 'vitest'
import { createReport } from './report'

describe('createReport', () => {
  it('uses only user messages as report evidence', () => {
    const report = createReport([
      { id: '1', role: 'user', kind: 'text', text: '我担心明天的汇报' },
      { id: '2', role: 'assistant', kind: 'text', text: '谢谢你说出来' },
    ])

    expect(report.evidence).toEqual(['我担心明天的汇报'])
    expect(report.title).toContain('汇报')
  })
})
