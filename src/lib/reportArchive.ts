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

export function loadReports(): ArchivedReport[] {
  try {
    const parsed = JSON.parse(get(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is ArchivedReport => Boolean(item?.id && item?.title)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []
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
