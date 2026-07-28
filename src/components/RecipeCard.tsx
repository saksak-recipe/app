import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { recipeCardStyles } from '@/theme/recipeCardStyles';

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
      style={({ pressed }) => [recipeCardStyles.card, pressed && recipeCardStyles.pressed]}
    >
      <View style={recipeCardStyles.titleRow}>
        <Text numberOfLines={1} style={recipeCardStyles.name}>
          {recipe.recipe_name}
        </Text>
        <View style={recipeCardStyles.difficulty}>
          <Text style={recipeCardStyles.difficultyText}>{recipe.recipe_difficulty}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.owned}>
        있어요 · {formatIngredients(recipe.owned_ingredients)}
      </Text>
      <Text numberOfLines={2} style={styles.missing}>
        필요해요 · {formatIngredients(recipe.missing_ingredients)}
      </Text>
      <View style={[recipeCardStyles.timeRow, styles.timeRow]}>
        <Ionicons color={colors.primary} name="time-outline" size={16} />
        <Text style={recipeCardStyles.time}>{recipe.time}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 2,
  },
});
