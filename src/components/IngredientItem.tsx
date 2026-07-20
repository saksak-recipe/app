import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ingredient } from '@/types/api';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

type IngredientItemProps = {
  item: Ingredient;
  onDelete: (id: number) => void;
  deleting?: boolean;
};

function formatDate(value: string): string {
  return value.slice(0, 10);
}

export function IngredientItem({ item, onDelete, deleting }: IngredientItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="leaf" size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{item.ingredient_name}</Text>
        <Text style={styles.meta}>구매일 {formatDate(item.purchase_date)}</Text>
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
    </View>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
