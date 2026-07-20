import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRecipeDetail } from '@/api/recipes';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { clayShadow, clayShadowSoft } from '@/theme/shadows';

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function detailErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return '해당 레시피를 찾지 못했어요';
  }

  return '레시피를 불러오지 못했어요. 다시 시도해 주세요';
}

export default function RecipeDetailScreen() {
  const { author_name: authorNameParam, board_name: boardNameParam } =
    useLocalSearchParams<{
      board_name?: string | string[];
      author_name?: string | string[];
    }>();
  const boardName = getFirstParam(boardNameParam);
  const authorName = getFirstParam(authorNameParam);
  const detailQuery = useQuery({
    queryKey: ['recipes', 'detail', boardName, authorName],
    queryFn: () => getRecipeDetail(boardName!, authorName!),
    enabled: Boolean(boardName && authorName),
  });

  if (!boardName || !authorName) {
    return <DetailError message="해당 레시피를 찾지 못했어요" />;
  }

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
    return (
      <DetailError
        message={detailErrorMessage(detailQuery.error)}
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const recipe = detailQuery.data;
  if (!recipe) {
    return <DetailError message="해당 레시피를 찾지 못했어요" />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {recipe.main_image_url ? (
          <Image
            accessibilityLabel={`${recipe.recipe_name} 대표 이미지`}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={recipe.main_image_url}
            style={styles.mainImage}
            transition={200}
          />
        ) : null}

        <View style={styles.titleSection}>
          <Text style={styles.recipeName}>{recipe.recipe_name}</Text>
          <Text style={styles.authorName}>{recipe.author_name}</Text>
        </View>

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
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={onRetry}
          />
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
  mainImage: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    ...clayShadow,
  },
  titleSection: {
    gap: 6,
  },
  recipeName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
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
