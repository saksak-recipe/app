import { useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRouter, type Href } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { getRecipeRecommendations } from '@/api/recipes';
import { Button } from '@/components/Button';
import { RecipeCard } from '@/components/RecipeCard';
import { ScopeToggle } from '@/components/ScopeToggle';
import { useGroupScope } from '@/hooks/useGroupScope';
import { colors } from '@/theme/colors';
import type { RecipeRecommendation } from '@/types/api';

export default function RecipeRecommendationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { scope, hasGroup, setScope } = useGroupScope();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel="저장한 레시피"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/(main)/recipes/saved' as Href)}
          style={styles.headerRight}
        >
          <Text style={styles.headerRightText}>저장</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const query = useQuery({
    queryKey: queryKeys.recipes.recommendations(scope),
    queryFn: () => getRecipeRecommendations(scope),
  });

  const recipes: RecipeRecommendation[] = query.data?.recipes ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      {hasGroup ? (
        <View style={styles.scopeWrap}>
          <ScopeToggle scope={scope} onChange={setScope} />
        </View>
      ) : null}
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingHint}>냉장고 재료로 레시피를 고르는 중…</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>레시피를 불러오지 못했어요</Text>
          <Text style={styles.errorDesc}>{getErrorMessage(query.error)}</Text>
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        </View>
      ) : (
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
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
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
          )}
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
  scopeWrap: {
    marginHorizontal: 20,
    marginTop: 12,
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
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  headerRight: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerRightText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '600',
  },
});
