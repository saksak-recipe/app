import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { mergePersonalIntoGroup } from '@/api/groups';
import {
  getIngredients,
  getShoppingItems,
} from '@/api/ingredients';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';
import type { Ingredient, ShoppingItem } from '@/types/api';

type MergeMode = 'copy' | 'move';

function ToggleRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleRow, selected && styles.toggleRowSelected]}
    >
      <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectableItem({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.selectRow}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
      <Text style={styles.selectLabel}>{label}</Text>
    </Pressable>
  );
}

export default function MergeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<MergeMode>('copy');
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [selectedShopping, setSelectedShopping] = useState<number[]>([]);

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', 'personal'],
    queryFn: () => getIngredients('personal'),
  });

  const shoppingQuery = useQuery({
    queryKey: ['shopping', 'personal'],
    queryFn: () => getShoppingItems('personal'),
  });

  const mergeMutation = useMutation({
    mutationFn: () =>
      mergePersonalIntoGroup({
        mode,
        ingredients: selectedIngredients,
        shopping_items: selectedShopping,
      }),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ingredients'] }),
        queryClient.invalidateQueries({ queryKey: ['shopping'] }),
        queryClient.invalidateQueries({ queryKey: ['group'] }),
      ]);

      const created =
        result.created_ingredients.length + result.created_shopping_items.length;
      const skipped =
        result.skipped_ingredient_ids.length + result.skipped_shopping_item_ids.length;

      Alert.alert(
        '병합 완료',
        `${created}개 항목을 가족으로 보냈어요.${skipped > 0 ? ` (${skipped}개 건너뜀)` : ''}`,
        [{ text: '확인', onPress: () => router.back() }],
      );
    },
    onError: (err) => Alert.alert('병합 실패', getErrorMessage(err)),
  });

  const toggleIngredient = (id: number) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleShopping = (id: number) => {
    setSelectedShopping((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const ingredients = ingredientsQuery.data ?? [];
  const shopping = shoppingQuery.data ?? [];
  const canSubmit = selectedIngredients.length > 0 || selectedShopping.length > 0;

  if (ingredientsQuery.isLoading || shoppingQuery.isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>가족으로 보내기</Text>
          <Text style={styles.subtitle}>
            내 냉장고·장보기 항목을 가족 그룹으로 복사하거나 이동할 수 있어요.
          </Text>

          <Text style={styles.sectionTitle}>방식</Text>
          <View style={styles.toggleGroup}>
            <ToggleRow
              label="복사 (내 항목 유지)"
              selected={mode === 'copy'}
              onPress={() => setMode('copy')}
            />
            <ToggleRow
              label="이동 (내 항목 삭제)"
              selected={mode === 'move'}
              onPress={() => setMode('move')}
            />
          </View>

          <Text style={styles.sectionTitle}>식재료</Text>
          {ingredients.length === 0 ? (
            <Text style={styles.empty}>내 냉장고에 식재료가 없어요.</Text>
          ) : (
            ingredients.map((item: Ingredient) => (
              <SelectableItem
                key={item.id}
                label={item.ingredient_name}
                selected={selectedIngredients.includes(item.id)}
                onPress={() => toggleIngredient(item.id)}
              />
            ))
          )}

          <Text style={styles.sectionTitle}>장보기</Text>
          {shopping.length === 0 ? (
            <Text style={styles.empty}>장보기 목록이 비어있어요.</Text>
          ) : (
            shopping.map((item: ShoppingItem) => (
              <SelectableItem
                key={item.id}
                label={item.name}
                selected={selectedShopping.includes(item.id)}
                onPress={() => toggleShopping(item.id)}
              />
            ))
          )}

          <Button
            loading={mergeMutation.isPending}
            disabled={!canSubmit}
            onPress={() => mergeMutation.mutate()}
            title="보내기"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 12,
    ...clayShadow,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  toggleGroup: { flexDirection: 'row', gap: 8 },
  toggleRow: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  toggleRowSelected: { backgroundColor: colors.primary },
  toggleText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  toggleTextSelected: { color: colors.surface },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  empty: { fontSize: 14, color: colors.textMuted },
});
