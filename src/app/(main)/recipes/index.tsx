import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { getRecipeRecommendations } from '@/api/recipes';
import { Button } from '@/components/Button';
import { RecipeCard } from '@/components/RecipeCard';
import { colors } from '@/theme/colors';
import type { RecipeRecommendation } from '@/types/api';

const RECIPE_RECOMMENDATIONS_KEY = ['recipes', 'recommendations'] as const;

export default function RecipeRecommendationsScreen() {
  const router = useRouter();
  const recipesQuery = useQuery({
    queryKey: RECIPE_RECOMMENDATIONS_KEY,
    queryFn: getRecipeRecommendations,
  });
  const recipes = recipesQuery.data?.recipes ?? [];

  const renderRecipe = ({ item }: { item: RecipeRecommendation }) => (
    <RecipeCard
      recipe={item}
      onPress={() =>
        router.push({
          pathname: '/(main)/recipes/detail',
          params: {
            board_name: item.board_name,
            author_name: item.author_name,
          },
        })
      }
    />
  );

  if (recipesQuery.isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (recipesQuery.isError) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>레시피를 불러오지 못했어요</Text>
          <Text style={styles.errorDesc}>{getErrorMessage(recipesQuery.error)}</Text>
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={() => void recipesQuery.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        data={recipes}
        keyExtractor={(item) => `${item.board_name}-${item.author_name}`}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>추천할 레시피가 없어요</Text>
            <Text style={styles.emptyDescription}>
              식재료를 추가하면 맞춤 레시피를 추천해 드릴게요.
            </Text>
          </View>
        }
        renderItem={renderRecipe}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    padding: 20,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  errorDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
