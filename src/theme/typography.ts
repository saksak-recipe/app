import { type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  section: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  } satisfies TextStyle,
} as const;
