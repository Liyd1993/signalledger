export type Role = 'user' | 'assistant'

export type Message = {
  id: string
  role: Role
  kind: 'text' | 'image'
  text?: string
  imageUrl?: string
}

export type ReflectionReport = {
  title: string
  feelings: string
  evidence: string[]
  nextStep: string
  nextQuestion: string
}
