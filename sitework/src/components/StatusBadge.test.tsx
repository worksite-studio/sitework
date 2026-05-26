import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the status text upper-cased', () => {
    render(<StatusBadge status="Paid" />)
    expect(screen.getByText('PAID')).toBeInTheDocument()
  })

  it('uses the success variant for known positive statuses', () => {
    const { container } = render(<StatusBadge status="Paid" />)
    expect(container.firstChild).toHaveClass('text-sw-success')
  })

  it('uses the danger variant for known negative statuses', () => {
    const { container } = render(<StatusBadge status="Rejected" />)
    expect(container.firstChild).toHaveClass('text-sw-danger')
  })

  it('falls back to neutral for unknown statuses', () => {
    const { container } = render(<StatusBadge status="MysteryStatus" />)
    expect(container.firstChild).toHaveClass('text-sw-muted')
  })

  it('honours the label override', () => {
    render(<StatusBadge status="Paid" label="Settled" />)
    expect(screen.getByText('Settled')).toBeInTheDocument()
  })

  it('honours the variant override', () => {
    const { container } = render(<StatusBadge status="Paid" variant="danger" />)
    expect(container.firstChild).toHaveClass('text-sw-danger')
  })
})
