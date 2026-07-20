import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { logout as logoutApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import {
  deleteAllIngredients,
  deleteIngredient,
  getIngredients,
} from '@/api/ingredients';
import { Button } from '@/components/Button';
import { EmptyFridge } from '@/components/EmptyFridge';
import { IngredientItem } from '@/components/IngredientItem';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

const INGREDIENTS_KEY = ['ingredients'] as const;

export default function FridgeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const ingredientsQuery = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: getIngredients,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onMutate: (id) => setDeletingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
    },
    onError: (err) => {
      Alert.alert('삭제 실패', getErrorMessage(err));
    },
    onSettled: () => setDeletingId(null),
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllIngredients,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
    },
    onError: (err) => {
      Alert.alert('전체 삭제 실패', getErrorMessage(err));
    },
  });

  const onLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const refresh = useAuthStore.getState().refreshToken;
            try {
              if (refresh) {
                await logoutApi(refresh);
              }
            } catch {
              // 서버 실패해도 로컬 세션은 지운다
            }
            await clearSession();
            router.replace('/(auth)/login');
          })();
        },
      },
    ]);
  };

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

  const items = ingredientsQuery.data ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>안녕하세요</Text>
            <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
          </View>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>식재료 {items.length}개</Text>
        </View>
      </View>

      {ingredientsQuery.isLoading ? (
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
          ListEmptyComponent={<EmptyFridge />}
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
          onPress={() => router.push('/(main)/add')}
          style={items.length > 0 ? styles.half : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 14,
    padding: 20,
    borderRadius: 28,
    backgroundColor: colors.surface,
    gap: 14,
    ...clayShadow,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: colors.textMuted,
  },
  nickname: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  logoutText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  full: {
    width: '100%',
  },
  half: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
