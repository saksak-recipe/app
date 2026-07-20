import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
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
import {
  deleteSavedRecipe,
  getAiRecipeDetail,
  getRecipeDetail,
  getSavedRecipe,
  getSavedRecipeStatus,
  saveRecipe,
  SAVED_RECIPES_KEY,
} from '@/api/recipes';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { clayShadow, clayShadowSoft } from '@/theme/shadows';
import type {
  RecipeIngredient,
  SavedRecipeSource,
} from '@/types/api';

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function detailErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return '해당 레시피를 찾지 못했어요';
  }

  return '레시피를 불러오지 못했어요. 다시 시도해 주세요';
}

function statusKey(source: SavedRecipeSource, sourceId: string) {
  return ['recipes', 'saved', 'status', source, sourceId] as const;
}

type DisplayRecipe = {
  recipe_name: string;
  author_name?: string;
  main_image_url?: string | null;
  ingredients: RecipeIngredient[];
  steps: Array<{
    order: number;
    description: string;
    tip: string | null;
    image_url: string | null;
  }>;
  tips: string[];
  owned_ingredients?: string[];
  missing_ingredients?: string[];
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    author_name: authorNameParam,
    board_name: boardNameParam,
    recipe_id: recipeIdParam,
    saved_id: savedIdParam,
    source: sourceParam,
  } = useLocalSearchParams<{
    board_name?: string | string[];
    author_name?: string | string[];
    recipe_id?: string | string[];
    saved_id?: string | string[];
    source?: string | string[];
  }>();
  const boardName = getFirstParam(boardNameParam);
  const authorName = getFirstParam(authorNameParam);
  const source = getFirstParam(sourceParam) ?? 'mangae';
  const recipeId = getFirstParam(recipeIdParam);
  const savedId = getFirstParam(savedIdParam);
  const isAi = source === 'ai';
  const isSavedView = source === 'saved';

  const mangaeQuery = useQuery({
    queryKey: ['recipes', 'detail', boardName, authorName],
    queryFn: () => getRecipeDetail(boardName!, authorName!),
    enabled: !isSavedView && !isAi && Boolean(boardName && authorName),
  });
  const aiQuery = useQuery({
    queryKey: ['recipes', 'ai', 'detail', recipeId],
    queryFn: () => getAiRecipeDetail(recipeId!),
    enabled: !isSavedView && isAi && Boolean(recipeId),
  });
  const savedQuery = useQuery({
    queryKey: ['recipes', 'saved', savedId],
    queryFn: () => getSavedRecipe(savedId!),
    enabled: isSavedView && Boolean(savedId),
  });

  const saveSource: SavedRecipeSource | null = isSavedView
    ? (savedQuery.data?.source ?? null)
    : isAi
      ? 'ai'
      : 'mangae';
  const saveSourceId = isSavedView
    ? (savedQuery.data?.source_id ?? null)
    : isAi
      ? (recipeId ?? null)
      : boardName && authorName
        ? `${boardName}|${authorName}`
        : null;

  const statusQuery = useQuery({
    queryKey:
      saveSource && saveSourceId
        ? statusKey(saveSource, saveSourceId)
        : ['recipes', 'saved', 'status', 'idle'],
    queryFn: () => getSavedRecipeStatus(saveSource!, saveSourceId!),
    enabled: Boolean(saveSource && saveSourceId) && !isSavedView,
  });

  const isSaved = isSavedView
    ? true
    : (statusQuery.data?.saved ?? false);
  const currentSavedId = isSavedView
    ? savedId
    : (statusQuery.data?.id ?? null);

  const saveMutation = useMutation({
    mutationFn: saveRecipe,
    onSuccess: async (data) => {
      if (saveSource && saveSourceId) {
        queryClient.setQueryData(statusKey(saveSource, saveSourceId), {
          saved: true,
          id: data.id,
        });
      }
      await queryClient.invalidateQueries({ queryKey: SAVED_RECIPES_KEY });
    },
    onError: async (err) => {
      if (isAxiosError(err) && err.response?.status === 409 && saveSource && saveSourceId) {
        await queryClient.invalidateQueries({
          queryKey: statusKey(saveSource, saveSourceId),
        });
        return;
      }
      Alert.alert('저장 실패', getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedRecipe,
    onSuccess: async () => {
      if (saveSource && saveSourceId) {
        queryClient.setQueryData(statusKey(saveSource, saveSourceId), {
          saved: false,
          id: null,
        });
      }
      await queryClient.invalidateQueries({ queryKey: SAVED_RECIPES_KEY });
      if (savedId) {
        queryClient.removeQueries({ queryKey: ['recipes', 'saved', savedId] });
      }
      if (isSavedView) {
        router.back();
      }
    },
    onError: (err) => {
      Alert.alert('저장 해제 실패', getErrorMessage(err));
    },
  });

  const togglePending = saveMutation.isPending || deleteMutation.isPending;

  const handleToggleSave = () => {
    if (isSaved) {
      if (!currentSavedId) {
        Alert.alert('저장 해제 실패', '저장된 레시피 정보를 찾지 못했어요.');
        return;
      }
      deleteMutation.mutate(currentSavedId);
      return;
    }
    if (!saveSource || !saveSourceId) {
      Alert.alert('저장 실패', '레시피 정보가 부족해요.');
      return;
    }
    saveMutation.mutate({ source: saveSource, source_id: saveSourceId });
  };

  if (isSavedView && !savedId) {
    return <DetailError message="해당 레시피를 찾지 못했어요" />;
  }
  if (!isSavedView && ((isAi && !recipeId) || (!isAi && (!boardName || !authorName)))) {
    return <DetailError message="해당 레시피를 찾지 못했어요" />;
  }

  const detailQuery = isSavedView ? savedQuery : isAi ? aiQuery : mangaeQuery;

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError) {
    const is404 =
      isAxiosError(detailQuery.error) &&
      detailQuery.error.response?.status === 404;

    return (
      <DetailError
        message={detailErrorMessage(detailQuery.error)}
        onRetry={is404 ? undefined : () => void detailQuery.refetch()}
      />
    );
  }

  const raw = detailQuery.data;
  if (!raw) {
    return <DetailError message="해당 레시피를 찾지 못했어요" />;
  }

  const recipe: DisplayRecipe = (() => {
    if (isSavedView) {
      const saved = savedQuery.data!;
      return {
        recipe_name: saved.recipe_name,
        author_name: saved.snapshot.author_name,
        main_image_url: saved.snapshot.main_image_url,
        ingredients: saved.snapshot.ingredients,
        steps: saved.snapshot.steps.map((step) => ({
          order: step.order,
          description: step.description,
          tip: null,
          image_url: null,
        })),
        tips: saved.snapshot.tips,
        owned_ingredients: saved.snapshot.owned_ingredients,
        missing_ingredients: saved.snapshot.missing_ingredients,
      };
    }
    if (isAi) {
      const ai = aiQuery.data!;
      return {
        recipe_name: ai.recipe_name,
        ingredients: ai.ingredients,
        steps: ai.steps,
        tips: ai.tips,
        owned_ingredients: ai.owned_ingredients,
        missing_ingredients: ai.missing_ingredients,
      };
    }
    const mangae = mangaeQuery.data!;
    return {
      recipe_name: mangae.recipe_name,
      author_name: mangae.author_name,
      main_image_url: mangae.main_image_url,
      ingredients: mangae.ingredients,
      steps: mangae.steps,
      tips: mangae.tips,
    };
  })();


  const canToggleSave =
    Boolean(saveSource && saveSourceId) &&
    (isSavedView || !detailQuery.isError);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {recipe.main_image_url ? (
          <View style={styles.mainImageWrap}>
            <Image
              accessibilityLabel={`${recipe.recipe_name} 대표 이미지`}
              cachePolicy="memory-disk"
              contentFit="cover"
              source={recipe.main_image_url}
              style={styles.mainImage}
              transition={200}
            />
          </View>
        ) : null}

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.recipeName}>{recipe.recipe_name}</Text>
            {canToggleSave ? (
              <Pressable
                accessibilityLabel={isSaved ? '저장됨, 저장 해제' : '레시피 저장'}
                accessibilityRole="button"
                disabled={togglePending || (!isSavedView && statusQuery.isLoading)}
                onPress={handleToggleSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  isSaved && styles.saveButtonActive,
                  pressed && styles.saveButtonPressed,
                  (togglePending || (!isSavedView && statusQuery.isLoading)) &&
                    styles.saveButtonDisabled,
                ]}
              >
                {togglePending || (!isSavedView && statusQuery.isLoading) ? (
                  <ActivityIndicator
                    color={isSaved ? colors.surface : colors.primaryDark}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.saveButtonText,
                      isSaved && styles.saveButtonTextActive,
                    ]}
                  >
                    {isSaved ? '저장됨' : '저장'}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
          {recipe.author_name ? (
            <Text style={styles.authorName}>{recipe.author_name}</Text>
          ) : null}
        </View>

        {recipe.owned_ingredients || recipe.missing_ingredients ? (
          <Section title="재료 상태">
            <Text style={styles.ownedText}>
              있어요 ·{' '}
              {(recipe.owned_ingredients ?? []).length > 0
                ? recipe.owned_ingredients!.join(', ')
                : '없음'}
            </Text>
            <Text style={styles.missingText}>
              필요해요 ·{' '}
              {(recipe.missing_ingredients ?? []).length > 0
                ? recipe.missing_ingredients!.join(', ')
                : '없음'}
            </Text>
          </Section>
        ) : null}

        <Section title="재료">
          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={`${ingredient.name}-${index}`} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="조리 순서">
          <View style={styles.stepList}>
            {recipe.steps.map((step) => (
              <View key={step.order} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.order}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.image_url ? (
                    <Image
                      accessibilityLabel={`${step.order}단계 이미지`}
                      cachePolicy="memory-disk"
                      contentFit="cover"
                      source={step.image_url}
                      style={styles.stepImage}
                      transition={200}
                    />
                  ) : null}
                  {step.tip ? (
                    <View style={styles.tip}>
                      <Text style={styles.tipLabel}>TIP</Text>
                      <Text style={styles.tipText}>{step.tip}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Section>

        {recipe.tips.length > 0 ? (
          <Section title="요리 팁">
            <View style={styles.globalTips}>
              {recipe.tips.map((tip, index) => (
                <View key={`${tip}-${index}`} style={styles.globalTip}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.globalTipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{message}</Text>
        {onRetry ? (
          <Button title="다시 시도" variant="secondary" onPress={onRetry} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  mainImageWrap: {
    borderRadius: 24,
    ...clayShadow,
  },
  mainImage: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
  },
  titleSection: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recipeName: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    minWidth: 72,
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  saveButtonTextActive: {
    color: colors.surface,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  missingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.surface,
    ...clayShadowSoft,
  },
  ingredientList: {
    gap: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  ingredientAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  stepList: {
    gap: 24,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
  stepContent: {
    flex: 1,
    gap: 12,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  stepImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  tip: {
    gap: 4,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.accentSoft,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  globalTips: {
    gap: 10,
  },
  globalTip: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
  },
  globalTipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
});
