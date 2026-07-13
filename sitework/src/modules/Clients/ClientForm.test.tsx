import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from './ClientForm'
import { StateProvider } from '@/state/StateProvider'

function renderForm(props: Partial<React.ComponentProps<typeof ClientForm>> = {}) {
  return render(
    <StateProvider>
      <ClientForm open onClose={() => {}} {...props} />
    </StateProvider>,
  )
}

describe('ClientForm', () => {
  it('renders required Name field', () => {
    renderForm()
    expect(screen.getByText(/^Company \/ Client Name/)).toBeInTheDocument()
  })

  it('blocks save when Name is empty and shows red-line error', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Save Client' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('accepts save once Name has content', async () => {
    const user = userEvent.setup()
    let closed = false
    renderForm({ onClose: () => (closed = true) })
    await user.type(screen.getByLabelText(/^Company \/ Client Name/), 'Smith Family')
    await user.click(screen.getByRole('button', { name: 'Save Client' }))
    expect(closed).toBe(true)
  })

  it('Edit mode pre-fills the form', () => {
    renderForm({
      initial: {
        // Branded ids — cast through unknown to satisfy strict TS in tests.
        id: 'CLI-001' as unknown as import('@/types').ClientId,
        name: 'Existing Co',
        abn: '12 345 678 901',
        contact: 'Alex',
        phone: '0412 000 000',
        email: 'alex@example.com',
        address: '1 Sample St',
      },
    })
    expect(screen.getByDisplayValue('Existing Co')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12 345 678 901')).toBeInTheDocument()
  })
})
