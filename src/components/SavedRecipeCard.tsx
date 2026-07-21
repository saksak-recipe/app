import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';
import type { SavedRecipeListItem } from '@/types/api';

type SavedRecipeCardProps = {
  recipe: SavedRecipeListItem;
  deleting?: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export function SavedRecipeCard({
  recipe,
  deleting = false,
  onPress,
  onDelete,
}: SavedRecipeCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${recipe.recipe_name} 저장 레시피 보기`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.name}>
          {recipe.recipe_name}
        </Text>
        <Pressable
          accessibilityLabel="저장 삭제"
          accessibilityRole="button"
          disabled={deleting}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation?.();
            onDelete();
          }}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deletePressed,
            deleting && styles.deleteDisabled,
          ]}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={20} />
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        {recipe.recipe_difficulty ? (
          <View style={styles.difficulty}>
            <Text style={styles.difficultyText}>{recipe.recipe_difficulty}</Text>
          </View>
        ) : null}
        {recipe.time ? (
          <View style={styles.timeRow}>
            <Ionicons color={colors.primary} name="time-outline" size={16} />
            <Text style={styles.time}>{recipe.time}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    gap: 10,
    ...clayShadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  deletePressed: {
    opacity: 0.8,
  },
  deleteDisabled: {
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  difficulty: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.accentSoft,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
