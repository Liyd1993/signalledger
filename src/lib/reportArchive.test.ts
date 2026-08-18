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
})
