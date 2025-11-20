import { colors } from './colors';
import { typography, spacing, borderRadius, shadows } from './tokens';

export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
};

export type Theme = typeof theme;

// Re-export for convenience
export { colors, typography, spacing, borderRadius, shadows };
