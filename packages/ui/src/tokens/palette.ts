/**
 * Resolved light-theme values for places that cannot read CSS variables: generated images (Open
 * Graph, app icons) and the web manifest. styles.css stays the source; tokens.test.ts fails if
 * these drift from it.
 */
export const LIGHT_THEME_COLORS = {
  background: '#f3ead8',
  card: '#fbf6ec',
  foreground: '#3b2a1e',
  'muted-foreground': '#6e5846',
  primary: '#6b4226',
  'logo-green': '#009c3b',
  'logo-yellow': '#f2b705',
  'logo-blue': '#1f5fbf',
  'logo-outline': '#3b2a1e',
} as const;
