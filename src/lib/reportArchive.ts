import type { ArchivedReport, ReflectionReport } from '../types'

const storageKey = 'echoreport:reports'
const memory = new Map<string, string>()

function get(key: string) {
  try { return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null } catch { return memory.get(key) ?? null }
}
function set(key: string, value: string) {
  try { globalThis.localStorage?.setItem(key, value); return } catch { memory.set(key, value) }
}
function remove(key: string) {
  try { globalThis.localStorage?.removeItem(key) } catch { memory.delete(key) }
}

function isArchivedReport(item: unknown): item is ArchivedReport {
  if (!item || typeof item !== 'object') return false
  const report = item as Partial<ArchivedReport>
  return ['id', 'createdAt', 'title', 'summary', 'feelings', 'nextStep', 'nextQuestion'].every((key) => typeof report[key as keyof ArchivedReport] === 'string')
    && Array.isArray(report.evidence)
    && report.evidence.every((line) => typeof line === 'string')
}

export function loadReports(): ArchivedReport[] {
  try {
    const parsed = JSON.parse(get(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isArchivedReport).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []
  } catch {
    return []
  }
}

export function archiveReport(report: ReflectionReport, createdAt = new Date().toISOString()): ArchivedReport {
  const archived: ArchivedReport = { ...report, id: crypto.randomUUID(), createdAt, summary: report.feelings }
  set(storageKey, JSON.stringify([archived, ...loadReports()]))
  return archived
}

export function clearReports() {
  remove(storageKey)
}
