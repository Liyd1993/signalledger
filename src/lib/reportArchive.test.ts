import { beforeEach, describe, expect, it, vi } from 'vitest'
import { archiveReport, clearReports, loadReports } from './reportArchive'

const report = { title: '一段回顾', feelings: '有些累。', evidence: ['今天很忙'], nextStep: '喝水。', nextQuestion: '现在需要什么？' }

describe('report archive', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
    clearReports()
  })
  it('saves reports newest first', () => {
    archiveReport(report, '2026-08-18T08:00:00.000Z')
    archiveReport({ ...report, title: '新报告' }, '2026-08-18T09:00:00.000Z')
    expect(loadReports().map((item) => item.title)).toEqual(['新报告', '一段回顾'])
  })
  it('recovers from malformed storage', () => {
    localStorage.setItem('echoreport:reports', '{bad json')
    expect(loadReports()).toEqual([])
  })

  it('ignores incomplete archived reports', () => {
    localStorage.setItem('echoreport:reports', JSON.stringify([
      { id: 'broken', title: '不完整报告' },
      { ...report, id: 'valid', createdAt: '2026-08-19T09:00:00.000Z', summary: report.feelings },
    ]))
    expect(loadReports().map((item) => item.id)).toEqual(['valid'])
  })
})
