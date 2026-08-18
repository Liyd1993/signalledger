export type Role = 'user' | 'assistant'

export type Message = {
  id: string
  role: Role
  text: string
}

export type ReflectionReport = {
  title: string
  feelings: string
  evidence: string[]
  nextStep: string
  nextQuestion: string
}
