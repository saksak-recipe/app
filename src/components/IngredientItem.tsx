import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ingredient, IngredientStatus } from '@/types/api';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

type IngredientItemProps = {
  item: Ingredient;
  onDelete: (id: number) => void;
  onEdit?: (item: Ingredient) => void;
  deleting?: boolean;
};

const STATUS_LABEL: Record<IngredientStatus, string> = {
  expired: '유통기한 지남',
  soon: '곧 만료',
  ok: '양호',
  unknown: '미설정',
};

const STATUS_COLOR: Record<IngredientStatus, string> = {
  expired: colors.danger,
  soon: colors.accent,
  ok: colors.primary,
  unknown: colors.textMuted,
};

const STATUS_BG: Record<IngredientStatus, string> = {
  expired: colors.dangerSoft,
  soon: colors.accentSoft,
  ok: colors.primarySoft,
  unknown: colors.border,
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.slice(0, 10);
}

export function IngredientItem({ item, onDelete, onEdit, deleting }: IngredientItemProps) {
  const purchaseDate = formatDate(item.purchase_date);
  const expirationDate = formatDate(item.expiration_date);

  return (
    <Pressable
      disabled={!onEdit}
      onPress={() => onEdit?.(item)}
      style={({ pressed }) => [styles.row, onEdit && pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="leaf" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{item.ingredient_name}</Text>
        <Text style={styles.meta}>
          {purchaseDate ? `구매일 ${purchaseDate}` : null}
          {purchaseDate && expirationDate ? ' · ' : null}
          {expirationDate ? `유통기한 ${expirationDate}` : null}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: STATUS_BG[item.status] }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status]}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={`${item.ingredient_name} 삭제`}
        disabled={deleting}
        hitSlop={8}
        onPress={() => onDelete(item.id)}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...clayShadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
