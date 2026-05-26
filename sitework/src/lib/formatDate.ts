/**
 * Date formatter, matches the legacy `Ft()` helper. Accepts an ISO date
 * string ("2026-05-26") or a Date object, returns "26 May 2026".
 *
 * Returns the input unchanged if it can't be parsed, so a stray empty
 * string in seed data shows as "" rather than "Invalid Date".
 */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function formatDate(input: string | Date | null | undefined): string {
  if (input == null || input === '') return ''
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return typeof input === 'string' ? input : ''
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}
