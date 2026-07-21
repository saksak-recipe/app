import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { getIngredients } from '@/api/ingredients';
import { getRecipeRecommendations } from '@/api/recipes';
import { EmptyState } from '@/components/EmptyState';
import { ExpiryIngredientRow } from '@/components/ExpiryIngredientRow';
import { RecipeCard } from '@/components/RecipeCard';
import { SectionHeader } from '@/components/SectionHeader';
import { selectExpiringIngredients } from '@/lib/ingredients';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { clayShadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Ingredient, RecipeRecommendation } from '@/types/api';

const INGREDIENTS_KEY = ['ingredients', 'personal'] as const;
const RECIPES_KEY = ['recipes', 'recommendations', 'personal'] as const;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const ingredientsQuery = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => getIngredients('personal'),
  });

  const recipesQuery = useQuery({
    queryKey: RECIPES_KEY,
    queryFn: () => getRecipeRecommendations('personal'),
  });

  const ingredients = ingredientsQuery.data ?? [];
  const expiring = selectExpiringIngredients(ingredients, 5);
  const recipes = (recipesQuery.data?.recipes ?? []).slice(0, 3);

  const refreshing =
    ingredientsQuery.isRefetching || recipesQuery.isRefetching;

  const onRefresh = () => {
    void ingredientsQuery.refetch();
    void recipesQuery.refetch();
  };

  const onEditIngredient = (item: Ingredient) => {
    router.push({
      pathname: '/(main)/edit-ingredient',
      params: {
        id: String(item.id),
        name: item.ingredient_name,
        purchase_date: item.purchase_date.slice(0, 10),
        expiration_date: item.expiration_date?.slice(0, 10) ?? '',
        scope: 'personal',
      },
    } as unknown as Href);
  };

  const onRecipePress = (recipe: RecipeRecommendation) => {
    router.push({
      pathname: '/(main)/recipes/detail',
      params: {
        board_name: recipe.board_name,
        author_name: recipe.author_name,
      },
    });
  };

  const initialLoading =
    (ingredientsQuery.isLoading && !ingredientsQuery.data) ||
    (recipesQuery.isLoading && !recipesQuery.data);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerCard}>
            <Text style={styles.greeting}>안녕하세요</Text>
            <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="임박한 식재료"
              actionLabel="냉장고 전체 보기"
              onAction={() => router.push('/(main)/(tabs)/fridge' as Href)}
            />
            {ingredientsQuery.isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="식재료를 불러오지 못했어요"
                description={getErrorMessage(ingredientsQuery.error)}
                actionLabel="다시 시도"
                onAction={() => void ingredientsQuery.refetch()}
              />
            ) : ingredients.length === 0 ? (
              <EmptyState
                icon="snow-outline"
                title="냉장고가 비어 있어요"
                description="식재료를 추가하면 유통기한 임박 알림을 볼 수 있어요."
                actionLabel="식재료 추가"
                onAction={() =>
                  router.push({
                    pathname: '/(main)/add',
                    params: { scope: 'personal' },
                  })
                }
              />
            ) : expiring.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title="유통기한이 임박한 재료가 없어요"
                description="냉장고에 있는 재료는 모두 여유 있어요."
                actionLabel="냉장고 보기"
                onAction={() => router.push('/(main)/(tabs)/fridge' as Href)}
              />
            ) : (
              <View style={styles.listGap}>
                {expiring.map((item) => (
                  <ExpiryIngredientRow
                    key={item.id}
                    item={item}
                    onPress={onEditIngredient}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="추천 레시피"
              actionLabel="더 많은 레시피"
              onAction={() => router.push('/(main)/recipes')}
            />
            {recipesQuery.isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="레시피를 불러오지 못했어요"
                description={getErrorMessage(recipesQuery.error)}
                actionLabel="다시 시도"
                onAction={() => void recipesQuery.refetch()}
              />
            ) : recipes.length === 0 ? (
              <EmptyState
                icon="restaurant-outline"
                title="추천 레시피가 없어요"
                description="식재료를 추가하면 맞춤 레시피를 추천해 드려요."
                actionLabel="식재료 추가"
                onAction={() =>
                  router.push({
                    pathname: '/(main)/add',
                    params: { scope: 'personal' },
                  })
                }
              />
            ) : (
              <View style={styles.listGap}>
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={`${recipe.board_name}-${recipe.author_name}`}
                    recipe={recipe}
                    onPress={() => onRecipePress(recipe)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  headerCard: {
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    ...clayShadow,
  },
  greeting: typography.caption,
  nickname: typography.title,
  section: { gap: spacing.sm },
  listGap: { gap: spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
