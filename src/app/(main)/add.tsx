import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { addIngredients } from '@/api/ingredients';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

const SUGGESTIONS = ['양파', '당근', '계란', '우유', '두부', '김치', '밥', '닭가슴살'];

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddIngredientScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rawInput, setRawInput] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(() => {
    return rawInput
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }, [rawInput]);

  const mutation = useMutation({
    mutationFn: addIngredients,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      router.back();
    },
    onError: (err) => {
      setError(getErrorMessage(err, '식재료 추가에 실패했습니다.'));
    },
  });

  const appendSuggestion = (name: string) => {
    setRawInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return name;
      }
      return `${trimmed}, ${name}`;
    });
  };

  const onSubmit = () => {
    setError(null);

    if (names.length === 0) {
      setError('추가할 식재료를 입력해주세요.');
      return;
    }

    const tooLong = names.find((name) => name.length > 45);
    if (tooLong) {
      setError(`"${tooLong}"은(는) 45자를 초과합니다.`);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError('구매일은 YYYY-MM-DD 형식이어야 합니다.');
      return;
    }

    mutation.mutate({
      purchase_date: purchaseDate,
      ingredients: names,
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.hint}>
              여러 개는 쉼표 또는 줄바꿈으로 구분해 한 번에 추가할 수 있어요.
            </Text>

            <TextField
              label="식재료"
              multiline
              onChangeText={setRawInput}
              placeholder={'예: 양파, 당근, 계란'}
              style={styles.multiline}
              textAlignVertical="top"
              value={rawInput}
            />

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => appendSuggestion(name)}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                >
                  <Text style={styles.chipText}>{name}</Text>
                </Pressable>
              ))}
            </View>

            <TextField
              label="구매일"
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              value={purchaseDate}
            />

            {names.length > 0 ? (
              <View style={styles.previewPill}>
                <Text style={styles.preview}>
                  {names.length}개 추가 예정: {names.join(', ')}
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              loading={mutation.isPending}
              disabled={names.length === 0}
              onPress={onSubmit}
              title="냉장고에 넣기"
            />

            <Button
              title="취소"
              variant="ghost"
              onPress={() => {
                if (mutation.isPending) {
                  Alert.alert('잠시만요', '추가 중입니다.');
                  return;
                }
                router.back();
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 16,
    ...clayShadow,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  multiline: {
    minHeight: 120,
    paddingTop: 14,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  chipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  chipText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  previewPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
  },
  preview: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
});
