import { describe, it, expect } from 'vitest'
import { newId } from './newId'

describe('newId', () => {
  it('keeps the PREFIX- convention', () => {
    expect(newId('INV')).toMatch(/^INV-[0-9a-f-]{8}$/)
  })

  it('never collides across rapid successive calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 1000; i++) ids.add(newId('CC'))
    expect(ids.size).toBe(1000)
  })
})
