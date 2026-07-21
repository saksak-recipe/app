import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { getMyGroup } from '@/api/groups';
import {
  addShoppingItems,
  deleteAllShoppingItems,
  deleteShoppingItem,
  getShoppingItems,
  shoppingItemToIngredient,
  updateShoppingItem,
} from '@/api/ingredients';
import { Button } from '@/components/Button';
import { ScopeToggle } from '@/components/ScopeToggle';
import { ShoppingItemRow } from '@/components/ShoppingItemRow';
import { TextField } from '@/components/TextField';
import { useScopeStore } from '@/stores/scopeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function shoppingKey(scope: string) {
  return ['shopping', scope] as const;
}

export default function ShoppingScreen() {
  const queryClient = useQueryClient();
  const scope = useScopeStore((state) => state.scope);
  const hasGroup = useScopeStore((state) => state.hasGroup);
  const setScope = useScopeStore((state) => state.setScope);
  const setHasGroup = useScopeStore((state) => state.setHasGroup);

  const [input, setInput] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const groupQuery = useQuery({
    queryKey: ['group', 'me'],
    queryFn: getMyGroup,
    retry: false,
  });

  useEffect(() => {
    setHasGroup(groupQuery.isSuccess);
  }, [groupQuery.isSuccess, setHasGroup]);

  const shoppingQuery = useQuery({
    queryKey: shoppingKey(scope),
    queryFn: () => getShoppingItems(scope),
    enabled: scope === 'personal' || groupQuery.isSuccess,
  });

  const addMutation = useMutation({
    mutationFn: (names: string[]) => addShoppingItems({ names }, scope),
    onSuccess: async () => {
      setInput('');
      await queryClient.invalidateQueries({ queryKey: shoppingKey(scope) });
    },
    onError: (err) => {
      Alert.alert('추가 실패', getErrorMessage(err));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: number; checked: boolean }) =>
      updateShoppingItem(id, { is_checked: checked }, scope),
    onMutate: ({ id }) => setTogglingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shoppingKey(scope) });
    },
    onError: (err) => {
      Alert.alert('변경 실패', getErrorMessage(err));
    },
    onSettled: () => setTogglingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingItem(id, scope),
    onMutate: (id) => setDeletingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shoppingKey(scope) });
    },
    onError: (err) => {
      Alert.alert('삭제 실패', getErrorMessage(err));
    },
    onSettled: () => setDeletingId(null),
  });

  const moveMutation = useMutation({
    mutationFn: (id: number) => shoppingItemToIngredient(id, scope),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shoppingKey(scope) }),
        queryClient.invalidateQueries({ queryKey: ['ingredients', scope] }),
      ]);
    },
    onError: (err) => {
      Alert.alert('이동 실패', getErrorMessage(err));
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllShoppingItems(scope),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shoppingKey(scope) });
    },
    onError: (err) => {
      Alert.alert('전체 삭제 실패', getErrorMessage(err));
    },
  });

  const onAdd = () => {
    const names = input
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) {
      Alert.alert('입력 필요', '추가할 항목을 입력해주세요.');
      return;
    }

    addMutation.mutate(names);
  };

  const items = shoppingQuery.data ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>장보기 목록</Text>
        <Text style={styles.subtitle}>사야 할 재료를 체크하고 냉장고로 옮겨보세요.</Text>
        {hasGroup ? (
          <ScopeToggle scope={scope} onChange={setScope} />
        ) : null}
        <View style={styles.addRow}>
          <TextField
            label="항목 추가"
            onChangeText={setInput}
            placeholder="예: 양파, 우유"
            style={styles.input}
            value={input}
          />
          <Button
            loading={addMutation.isPending}
            onPress={onAdd}
            title="추가"
            style={styles.addBtn}
          />
        </View>
      </View>

      {scope === 'group' && groupQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>가족 장보기를 불러올 수 없어요</Text>
        </View>
      ) : shoppingQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>장보기 목록이 비어있어요</Text>
              <Text style={styles.emptyDesc}>필요한 재료를 추가해보세요.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={shoppingQuery.isRefetching}
              onRefresh={() => void shoppingQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ShoppingItemRow
              item={item}
              toggling={togglingId === item.id}
              deleting={deletingId === item.id}
              onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onMoveToFridge={(id) => {
                Alert.alert('냉장고로 이동', `"${item.name}"을(를) 냉장고에 넣을까요?`, [
                  { text: '취소', style: 'cancel' },
                  { text: '이동', onPress: () => moveMutation.mutate(id) },
                ]);
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {items.length > 0 ? (
        <View style={styles.actions}>
          <Button
            title="전체 삭제"
            variant="danger"
            loading={deleteAllMutation.isPending}
            onPress={() => {
              Alert.alert('전체 삭제', '장보기 목록을 모두 삭제할까요?', [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: () => deleteAllMutation.mutate(),
                },
              ]);
            }}
          />
        </View>
      ) : null}
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
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  addRow: { gap: 10 },
  input: { marginBottom: 0 },
  addBtn: { alignSelf: 'flex-end', minWidth: 100 },
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
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textMuted },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
});
