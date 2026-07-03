/**
 * Collision-safe entity IDs. Replaces the legacy `PREFIX-${Date.now()}`
 * pattern, which collides when two records are created in the same
 * millisecond. Keeps the `PREFIX-` convention so seed IDs and the branded
 * `asId<T>` types are untouched.
 */
export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
