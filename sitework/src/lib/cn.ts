/**
 * Tiny className combiner. Joins truthy strings with spaces — same shape
 * as shadcn's `cn()` so we can swap to clsx + tailwind-merge later without
 * call-site changes.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
