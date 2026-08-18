import { describe, expect, it } from 'vitest'
import { createConversation } from './conversation'

describe('conversation gate', () => {
  it('unlocks only after ten user messages', () => {
    const conversation = createConversation()
    for (let index = 0; index < 9; index += 1) conversation.send(`第${index + 1}句`)
    expect(conversation.canCreateReport.value).toBe(false)
    conversation.send('第10句')
    expect(conversation.canCreateReport.value).toBe(true)
  })

  it('unlocks again after five user messages following a report', () => {
    const conversation = createConversation()
    for (let index = 0; index < 10; index += 1) conversation.send(`第${index + 1}句`)
    expect(conversation.createCurrentReport()).not.toBeNull()
    for (let index = 0; index < 4; index += 1) conversation.send(`后续第${index + 1}句`)
    expect(conversation.canCreateReport.value).toBe(false)
    conversation.send('后续第5句')
    expect(conversation.canCreateReport.value).toBe(true)
  })

  it('suppresses reports after a risk message', () => {
    const conversation = createConversation()
    conversation.send('我想自杀')
    expect(conversation.crisisActive.value).toBe(true)
    expect(conversation.canCreateReport.value).toBe(false)
  })
})
