import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

type RecipeCardRecipe = {
  recipe_name: string;
  owned_ingredients: string[];
  missing_ingredients: string[];
  recipe_difficulty: string;
  time: string;
};

type RecipeCardProps = {
  recipe: RecipeCardRecipe;
  onPress: () => void;
};

function formatIngredients(items: string[]): string {
  return items.length > 0 ? items.join(', ') : '없음';
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${recipe.recipe_name} 레시피 보기`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.name}>
          {recipe.recipe_name}
        </Text>
        <View style={styles.difficulty}>
          <Text style={styles.difficultyText}>{recipe.recipe_difficulty}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.owned}>
        있어요 · {formatIngredients(recipe.owned_ingredients)}
      </Text>
      <Text numberOfLines={2} style={styles.missing}>
        필요해요 · {formatIngredients(recipe.missing_ingredients)}
      </Text>
      <View style={styles.timeRow}>
        <Ionicons color={colors.primary} name="time-outline" size={16} />
        <Text style={styles.time}>{recipe.time}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    gap: 8,
    ...clayShadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
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
  owned: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  missing: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
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
