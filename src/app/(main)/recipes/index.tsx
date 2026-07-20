import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import {
  deleteSavedRecipe,
  getAiRecipeRecommendations,
  getRecipeRecommendations,
  listSavedRecipes,
  SAVED_RECIPES_KEY,
} from '@/api/recipes';
import { Button } from '@/components/Button';
import { RecipeCard } from '@/components/RecipeCard';
import { SavedRecipeCard } from '@/components/SavedRecipeCard';
import { colors } from '@/theme/colors';
import type {
  AiRecipeRecommendation,
  RecipeRecommendation,
  SavedRecipeListItem,
} from '@/types/api';

const RECIPE_RECOMMENDATIONS_KEY = ['recipes', 'recommendations'] as const;
const AI_RECIPE_RECOMMENDATIONS_KEY = ['recipes', 'ai', 'recommendations'] as const;

type RecipeSourceTab = 'mangae' | 'ai' | 'saved';
type RecipeListItem = RecipeRecommendation | AiRecipeRecommendation;

export default function RecipeRecommendationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RecipeSourceTab>('mangae');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mangaeQuery = useQuery({
    queryKey: RECIPE_RECOMMENDATIONS_KEY,
    queryFn: getRecipeRecommendations,
    enabled: tab === 'mangae',
  });
  const aiQuery = useQuery({
    queryKey: AI_RECIPE_RECOMMENDATIONS_KEY,
    queryFn: getAiRecipeRecommendations,
    enabled: tab === 'ai',
  });
  const savedQuery = useQuery({
    queryKey: SAVED_RECIPES_KEY,
    queryFn: listSavedRecipes,
    enabled: tab === 'saved',
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedRecipe,
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVED_RECIPES_KEY });
      await queryClient.invalidateQueries({ queryKey: ['recipes', 'saved', 'status'] });
    },
    onError: (err) => {
      Alert.alert('삭제 실패', getErrorMessage(err));
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const activeQuery =
    tab === 'mangae' ? mangaeQuery : tab === 'ai' ? aiQuery : savedQuery;
  const recipes: RecipeListItem[] =
    tab === 'saved' ? [] : (activeQuery.data as { recipes?: RecipeListItem[] } | undefined)?.recipes ?? [];
  const savedRecipes: SavedRecipeListItem[] =
    tab === 'saved' ? (savedQuery.data ?? []) : [];

  const renderRecipe = ({ item }: { item: RecipeListItem }) => (
    <RecipeCard
      recipe={item}
      onPress={() =>
        'recipe_id' in item
          ? router.push({
              pathname: '/(main)/recipes/detail',
              params: { source: 'ai', recipe_id: item.recipe_id },
            })
          : router.push({
              pathname: '/(main)/recipes/detail',
              params: {
                board_name: item.board_name,
                author_name: item.author_name,
              },
            })
      }
    />
  );

  const renderSaved = ({ item }: { item: SavedRecipeListItem }) => (
    <SavedRecipeCard
      recipe={item}
      deleting={deletingId === item.id}
      onPress={() =>
        router.push({
          pathname: '/(main)/recipes/detail',
          params: { source: 'saved', saved_id: item.id },
        })
      }
      onDelete={() => {
        Alert.alert('저장 삭제', `"${item.recipe_name}"을(를) 삭제할까요?`, [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(item.id),
          },
        ]);
      }}
    />
  );

  const tabs = (
    <View style={styles.tabs}>
      {(
        [
          { key: 'mangae', label: '만개' },
          { key: 'ai', label: 'AI' },
          { key: 'saved', label: '저장' },
        ] as const
      ).map(({ key, label }) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === key }}
          onPress={() => setTab(key)}
          style={[styles.tab, tab === key && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      {tabs}
      {activeQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          {tab === 'ai' ? (
            <Text style={styles.loadingHint}>냉장고 재료로 레시피를 고르는 중…</Text>
          ) : null}
        </View>
      ) : activeQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            {tab === 'ai'
              ? 'AI 레시피를 불러오지 못했어요'
              : tab === 'saved'
                ? '저장한 레시피를 불러오지 못했어요'
                : '레시피를 불러오지 못했어요'}
          </Text>
          <Text style={styles.errorDesc}>{getErrorMessage(activeQuery.error)}</Text>
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={() => void activeQuery.refetch()}
          />
        </View>
      ) : tab === 'saved' ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={savedRecipes}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>저장한 레시피가 없어요</Text>
              <Text style={styles.emptyDescription}>
                추천 레시피 상세에서 저장하면 여기에서 다시 볼 수 있어요.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={savedQuery.isRefetching}
              onRefresh={() => void savedQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={renderSaved}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={recipes}
          keyExtractor={(item) =>
            'recipe_id' in item
              ? item.recipe_id
              : `${item.board_name}-${item.author_name}`
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {tab === 'ai' ? '추천할 AI 레시피가 없어요' : '추천할 레시피가 없어요'}
              </Text>
              <Text style={styles.emptyDescription}>
                식재료를 추가하면 맞춤 레시피를 추천해 드릴게요.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={() => void activeQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={renderRecipe}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
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
  loadingHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
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
