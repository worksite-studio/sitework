import { useParams } from 'react-router-dom'
import { PROJECT_TABS } from '@/nav'
import { Placeholder } from '@/components/Placeholder'

/**
 * Generic stub for a project tab until each is ported (Sessions 8–10).
 * Reads the :tab param and shows its friendly label.
 */
export function ProjectTab() {
  const { tab } = useParams<{ tab: string }>()
  const match = PROJECT_TABS.find((t) => t.id === tab)
  return (
    <Placeholder
      title={match?.label ?? 'Tab'}
      note="This project tab is ported in a later Phase 4 session (8–10)."
    />
  )
}
