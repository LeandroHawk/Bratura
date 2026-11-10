// Components
export { Badge, type BadgeTone } from './components/Badge/Badge';
export {
  Button,
  ButtonLink,
  type ButtonSize,
  type ButtonVariant,
} from './components/Button/Button';
export { Card } from './components/Card/Card';
export { Container } from './components/Container/Container';
export { Eyebrow } from './components/Eyebrow/Eyebrow';
export { Heading, type HeadingSize } from './components/Heading/Heading';
export { Tag, type TagSize } from './components/Tag/Tag';
export { LOGO_LETTER_COLORS, Logo, SLOGAN, type LogoProps } from './components/Logo/Logo';
export {
  LOGO_SPLAT_SEED,
  SPLAT_VIEWBOX,
  splatShapesFromSeed,
  type SplatShape,
} from './components/Logo/splat';
export {
  HangingSign,
  type HangingSignFace,
  type HangingSignProps,
} from './components/HangingSign/HangingSign';
export { PullCord, type PullCordCopy } from './components/PullCord/PullCord';

// Theme
export { restoreSavedTheme, THEME_STORAGE_KEY, themeInitScript, type Theme } from './theme/script';
export { switchTheme, useTheme } from './theme/useTheme';

// Tokens
export { LIGHT_THEME_COLORS } from './tokens/palette';
export {
  COLOR_TOKENS,
  CONTRAST_PAIRS,
  type ColorTokenGroup,
  type ColorTokenName,
} from './tokens/tokens';

// Utils
export { prefersReducedMotion } from './utils/motion';
export { contrastRatioFromHex } from './utils/contrast';
