import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import {
  deleteSavedRecipe,
  listSavedRecipes,
  SAVED_RECIPES_KEY,
} from '@/api/recipes';
import { Button } from '@/components/Button';
import { SavedRecipeCard } from '@/components/SavedRecipeCard';
import { colors } from '@/theme/colors';
import type { SavedRecipeListItem } from '@/types/api';

export default function SavedRecipesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const savedQuery = useQuery({
    queryKey: SAVED_RECIPES_KEY,
    queryFn: listSavedRecipes,
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

  const savedRecipes: SavedRecipeListItem[] = savedQuery.data ?? [];

  if (savedQuery.isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (savedQuery.isError) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>저장한 레시피를 불러오지 못했어요</Text>
          <Text style={styles.errorDesc}>{getErrorMessage(savedQuery.error)}</Text>
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={() => void savedQuery.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        data={savedRecipes}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>저장한 레시피가 없어요</Text>
            <Text style={styles.emptyDescription}>
              만개의레시피 상세에서 저장하면 여기에서 다시 볼 수 있어요.
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
        renderItem={({ item }) => (
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
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, flexGrow: 1 },
  separator: { height: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
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
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
