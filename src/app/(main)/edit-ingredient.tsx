import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { updateIngredient } from '@/api/ingredients';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';
import type { DataScope } from '@/types/api';

export default function EditIngredientScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    purchase_date: string;
    expiration_date?: string;
    scope?: DataScope;
  }>();

  const scope = (params.scope ?? 'personal') as DataScope;
  const ingredientId = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [purchaseDate, setPurchaseDate] = useState(params.purchase_date ?? '');
  const [expirationDate, setExpirationDate] = useState(params.expiration_date ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateIngredient(
        ingredientId,
        {
          ingredient_name: name.trim(),
          purchase_date: purchaseDate || null,
          expiration_date: expirationDate || null,
        },
        scope,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ingredients', scope] });
      router.back();
    },
    onError: (err) => {
      setError(getErrorMessage(err, '수정에 실패했습니다.'));
    },
  });

  const onSubmit = () => {
    setError(null);

    if (name.trim().length === 0) {
      setError('식재료 이름을 입력해주세요.');
      return;
    }

    if (purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError('구매일은 YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      setError('유통기한은 YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    mutation.mutate();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <TextField label="식재료 이름" onChangeText={setName} value={name} />
            <TextField
              label="구매일"
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              value={purchaseDate}
            />
            <TextField
              label="유통기한 (선택)"
              onChangeText={setExpirationDate}
              placeholder="YYYY-MM-DD"
              value={expirationDate}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button loading={mutation.isPending} onPress={onSubmit} title="저장" />
            <Button
              title="취소"
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    ...clayShadow,
  },
  error: { color: colors.danger, fontSize: 14 },
});
