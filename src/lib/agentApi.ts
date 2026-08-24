import type { Message, ReflectionReport } from '../types'

const baseUrl = (import.meta.env.VITE_AGENT_API_URL as string | undefined)?.replace(/\/$/, '')

export const agentEnabled = Boolean(baseUrl)

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!baseUrl) throw new Error('VITE_AGENT_API_URL is not configured')
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`Agent request failed (${response.status})`)
  return response.json() as Promise<T>
}

export function askAgent(text: string, context: Message[]) {
  return post<{ text: string }>('/api/chat', { text, context })
}

export function generateAgentReport(messages: Message[]) {
  return post<ReflectionReport>('/api/report', { messages })
}
