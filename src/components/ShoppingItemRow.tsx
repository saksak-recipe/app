import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShoppingItem } from '@/types/api';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

type ShoppingItemRowProps = {
  item: ShoppingItem;
  onToggle: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
  onMoveToFridge?: (id: number) => void;
  toggling?: boolean;
  deleting?: boolean;
};

export function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
  onMoveToFridge,
  toggling,
  deleting,
}: ShoppingItemRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.is_checked }}
        disabled={toggling}
        onPress={() => onToggle(item.id, !item.is_checked)}
        style={({ pressed }) => [styles.checkBtn, pressed && styles.pressed]}
      >
        <Ionicons
          name={item.is_checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.is_checked ? colors.primary : colors.textMuted}
        />
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.name, item.is_checked && styles.nameChecked]}>
          {item.name}
        </Text>
      </View>
      {onMoveToFridge ? (
        <Pressable
          accessibilityLabel={`${item.name} 냉장고로 이동`}
          onPress={() => onMoveToFridge(item.id)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.primary} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={`${item.name} 삭제`}
        disabled={deleting}
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
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...clayShadow,
  },
  checkBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  nameChecked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
