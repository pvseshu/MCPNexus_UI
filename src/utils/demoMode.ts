// Single source of truth for "are we on the /demo URI".
// The /demo path always shows the static fixtures in src/data/initialData.ts,
// regardless of what live data sources get wired up for the regular app.
// See src/data/dataProvider.ts for where this gate is actually enforced.
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/demo');
}
