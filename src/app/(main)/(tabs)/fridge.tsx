import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  deleteAllIngredients,
  deleteIngredient,
  getIngredients,
} from '@/api/ingredients';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { IngredientItem } from '@/components/IngredientItem';
import { ScopeToggle } from '@/components/ScopeToggle';
import { useGroupScope } from '@/hooks/useGroupScope';
import { toDateOnly } from '@/lib/dates';
import { editIngredientHref } from '@/lib/navigation';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Ingredient } from '@/types/api';

export default function FridgeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { scope, hasGroup, setScope, groupQuery, isGroupReady } = useGroupScope();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const ingredientsQuery = useQuery({
    queryKey: queryKeys.ingredients.scope(scope),
    queryFn: () => getIngredients(scope),
    enabled: isGroupReady,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngredient(id, scope),
    onMutate: (id) => setDeletingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.ingredients.scope(scope),
      });
    },
    onError: (err) => {
      Alert.alert('삭제 실패', getErrorMessage(err));
    },
    onSettled: () => setDeletingId(null),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllIngredients(scope),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.ingredients.scope(scope),
      });
    },
    onError: (err) => {
      Alert.alert('전체 삭제 실패', getErrorMessage(err));
    },
  });

  const onDeleteAll = () => {
    Alert.alert('전체 삭제', '냉장고의 모든 식재료를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteAllMutation.mutate(),
      },
    ]);
  };

  const onEdit = (item: Ingredient) => {
    router.push(
      editIngredientHref({
        id: item.id,
        name: item.ingredient_name,
        purchaseDate: toDateOnly(item.purchase_date),
        expirationDate: toDateOnly(item.expiration_date),
        scope,
      }),
    );
  };

  const items = ingredientsQuery.data ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>식재료 {items.length}개</Text>
        </View>
        {hasGroup ? (
          <ScopeToggle
            scope={scope}
            onChange={setScope}
            disabled={groupQuery.isLoading}
          />
        ) : null}
      </View>

      {scope === 'group' && groupQuery.isError && !groupQuery.isSuccess ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>가족 냉장고를 불러올 수 없어요</Text>
          <Text style={styles.errorDesc}>
            가족 탭에서 그룹에 가입하거나 생성해주세요.
          </Text>
        </View>
      ) : ingredientsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : ingredientsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>목록을 불러오지 못했어요</Text>
          <Text style={styles.errorDesc}>
            {getErrorMessage(ingredientsQuery.error)}
          </Text>
          <Button
            title="다시 시도"
            onPress={() => void ingredientsQuery.refetch()}
            variant="secondary"
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <EmptyState
              icon="snow-outline"
              title="냉장고가 비어 있어요"
              description="식재료를 추가해 냉장고를 채워보세요."
              hint="아래에서 추가해 보세요"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={ingredientsQuery.isRefetching}
              onRefresh={() => void ingredientsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <IngredientItem
              item={item}
              deleting={deletingId === item.id}
              onDelete={(id) => {
                Alert.alert('식재료 삭제', `"${item.ingredient_name}"을(를) 삭제할까요?`, [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id),
                  },
                ]);
              }}
              onEdit={onEdit}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.actions}>
        <Button
          title="레시피 추천"
          variant="secondary"
          onPress={() => router.push('/(main)/recipes')}
          style={styles.full}
        />
        {items.length > 0 ? (
          <Button
            title="전체 비우기"
            variant="danger"
            loading={deleteAllMutation.isPending}
            onPress={onDeleteAll}
            style={styles.half}
          />
        ) : null}
        <Button
          title="식재료 추가"
          onPress={() =>
            router.push({
              pathname: '/(main)/add',
              params: { scope },
            })
          }
          style={items.length > 0 ? styles.half : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  greeting: { fontSize: 14, color: colors.textMuted },
  nickname: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  countText: { fontSize: 13, fontWeight: '600', color: colors.accent },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  separator: { height: spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  errorTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  errorDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  full: { width: '100%' },
  half: { flex: 1 },
});
