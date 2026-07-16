/**
 * Splash gate — tracks whether the user has "entered" for this page load.
 *
 * The flag is module-level, so it survives AppShell remounting during
 * client-side navigation (returning from a print view, which lives outside
 * AppShell, used to remount the shell and re-show the splash — the bug this
 * fixes). It resets on a genuine full page load (the module re-evaluates),
 * preserving the legacy "splash on every fresh load" behaviour.
 *
 * `sw:skipSplash` in sessionStorage is honoured too — tests and screenshot
 * tooling set it to bypass the splash entirely.
 */
let enteredThisLoad = false

export function hasEntered(): boolean {
  if (enteredThisLoad) return true
  try {
    return sessionStorage.getItem('sw:skipSplash') === '1'
  } catch {
    return false
  }
}

export function markEntered(): void {
  enteredThisLoad = true
}
