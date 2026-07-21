import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ingredient } from '@/types/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { clayShadowSoft } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ExpiryIngredientRowProps = {
  item: Ingredient;
  onPress: (item: Ingredient) => void;
};

const STATUS_LABEL: Record<'expired' | 'soon', string> = {
  expired: '지남',
  soon: '임박',
};

const STATUS_FG: Record<'expired' | 'soon', string> = {
  expired: colors.danger,
  soon: colors.accent,
};

const STATUS_BG: Record<'expired' | 'soon', string> = {
  expired: colors.dangerSoft,
  soon: colors.accentSoft,
};

export function ExpiryIngredientRow({ item, onPress }: ExpiryIngredientRowProps) {
  const status = item.status as 'expired' | 'soon';
  const date = item.expiration_date?.slice(0, 10) ?? '미설정';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text numberOfLines={1} style={styles.name}>
          {item.ingredient_name}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: STATUS_BG[status] }]}>
        <Text style={[styles.badgeText, { color: STATUS_FG[status] }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...clayShadowSoft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  left: { flex: 1, gap: 2 },
  name: { ...typography.body, fontWeight: '700' },
  date: typography.caption,
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.label },
});
