import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { recipeCardStyles } from '@/theme/recipeCardStyles';
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
      style={({ pressed }) => [recipeCardStyles.card, pressed && recipeCardStyles.pressed]}
    >
      <View style={recipeCardStyles.titleRow}>
        <Text numberOfLines={1} style={recipeCardStyles.name}>
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
          <View style={recipeCardStyles.difficulty}>
            <Text style={recipeCardStyles.difficultyText}>{recipe.recipe_difficulty}</Text>
          </View>
        ) : null}
        {recipe.time ? (
          <View style={recipeCardStyles.timeRow}>
            <Ionicons color={colors.primary} name="time-outline" size={16} />
            <Text style={recipeCardStyles.time}>{recipe.time}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
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
});
