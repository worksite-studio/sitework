import { useParams } from 'react-router-dom'
import { useAppState } from '@/state/context'
import type { Project, ProjectId } from '@/types'

/**
 * Convenience hook used by every project-scoped tab. Reads the :projectId
 * URL param, looks up the project in state, and returns it. Returns null
 * when the project isn't found — the ProjectLayout already renders the
 * not-found UI, so the tab can render its own loading/empty state.
 */
export function useProject(): Project | null {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects } = useAppState()
  return projects.find((p) => p.id === (projectId as ProjectId)) ?? null
}
