# Home Tab + Design Tokens Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하단 탭에 홈을 추가해 개인 임박 식재료(최대 5)와 만개의레시피 추천(최대 3)을 보여주고, spacing/radius/typography 토큰과 SectionHeader·ExpiryIngredientRow·EmptyState를 도입한다.

**Architecture:** 기존 `(tabs)/index`(냉장고)를 `fridge.tsx`로 옮기고 `index.tsx`를 홈 대시보드로 교체. 홈은 `getIngredients('personal')` + `getRecipeRecommendations('personal')`만 사용. 새 토큰은 홈(및 신규 컴포넌트)에만 우선 적용.

**Tech Stack:** Expo Router, React Native, TanStack Query, TypeScript, StyleSheet + clay theme

**Spec:** `docs/superpowers/specs/2026-07-21-home-tab-design.md`

## Global Constraints

- 탭: `홈 / 냉장고 / 장보기 / 가족 / 설정` (순서 고정)
- 홈 scope: 항상 `personal` (ScopeToggle 없음)
- 임박: `status === 'expired' | 'soon'`, 만료일 오름차순, 최대 5
- 레시피: 만개 `getRecipeRecommendations('personal')` 상위 3 (부족한 재료 있어도 표시)
- AI·저장 레시피 홈 미사용 / 신규 API 없음 / NativeWind·다크모드 없음
- 알림 `expiry_*` 탭 목적지는 `/(main)/(tabs)/fridge`
- 검증: `npx tsc --noEmit` (Jest 없음). 수동 확인은 각 Task Verify 단계

## File Structure

| File | Responsibility |
|------|----------------|
| `src/theme/spacing.ts` | spacing 토큰 |
| `src/theme/radius.ts` | borderRadius 토큰 |
| `src/theme/typography.ts` | TextStyle 토큰 |
| `src/lib/ingredients.ts` | 임박 필터·정렬·slice 헬퍼 |
| `src/components/SectionHeader.tsx` | 섹션 제목 + 액션 |
| `src/components/EmptyState.tsx` | 공용 빈/안내 상태 |
| `src/components/ExpiryIngredientRow.tsx` | 홈용 임박 행 |
| `src/app/(main)/(tabs)/fridge.tsx` | 기존 냉장고 화면 (이동) |
| `src/app/(main)/(tabs)/index.tsx` | 홈 대시보드 (신규) |
| `src/app/(main)/(tabs)/_layout.tsx` | 5탭 등록·라벨·아이콘 |
| `src/app/(main)/notifications.tsx` | expiry → fridge 경로 |

---

### Task 1: Design tokens

**Files:**
- Create: `src/theme/spacing.ts`
- Create: `src/theme/radius.ts`
- Create: `src/theme/typography.ts`

**Interfaces:**
- Produces:
  - `spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 28 } as const`
  - `radius = { sm: 12, md: 16, lg: 20, xl: 24, card: 28, pill: 999 } as const`
  - `typography` — `title`, `section`, `body`, `caption`, `label` (`TextStyle`)
- Consumes: `colors` from `@/theme/colors` (typography 색상용)

- [ ] **Step 1: Create spacing.ts**

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 28,
} as const;
```

- [ ] **Step 2: Create radius.ts**

```typescript
export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  card: 28,
  pill: 999,
} as const;
```

- [ ] **Step 3: Create typography.ts**

```typescript
import { type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  section: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  } satisfies TextStyle,
} as const;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add src/theme/spacing.ts src/theme/radius.ts src/theme/typography.ts
git commit -m "$(cat <<'EOF'
Feat: spacing·radius·typography 디자인 토큰 추가

EOF
)"
```

---

### Task 2: Expiring ingredients helper

**Files:**
- Create: `src/lib/ingredients.ts`

**Interfaces:**
- Consumes: `Ingredient` from `@/types/api`
- Produces: `selectExpiringIngredients(items: Ingredient[], limit?: number): Ingredient[]`
  - filter `status === 'expired' || status === 'soon'`
  - sort by `expiration_date` ascending; `null` dates last; equal dates keep stable order by `id`
  - default `limit = 5`

- [ ] **Step 1: Create helper**

```typescript
import type { Ingredient } from '@/types/api';

function expirationSortKey(value: string | null): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  return Date.parse(value);
}

export function selectExpiringIngredients(
  items: Ingredient[],
  limit = 5,
): Ingredient[] {
  return items
    .filter((item) => item.status === 'expired' || item.status === 'soon')
    .slice()
    .sort((a, b) => {
      const byDate = expirationSortKey(a.expiration_date) - expirationSortKey(b.expiration_date);
      if (byDate !== 0) {
        return byDate;
      }
      return a.id - b.id;
    })
    .slice(0, limit);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/ingredients.ts
git commit -m "$(cat <<'EOF'
Feat: 임박·만료 식재료 선택 헬퍼 추가

EOF
)"
```

---

### Task 3: Shared UI — SectionHeader, EmptyState, ExpiryIngredientRow

**Files:**
- Create: `src/components/SectionHeader.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/ExpiryIngredientRow.tsx`

**Interfaces:**
- Consumes: `colors`, `spacing`, `radius`, `typography`, `clayShadowSoft`, `Ingredient`, Ionicons
- Produces:
  - `SectionHeader({ title, actionLabel?, onAction? })`
  - `EmptyState({ icon, title, description, actionLabel?, onAction? })` — `icon`은 `keyof typeof Ionicons.glyphMap` 또는 `React.ComponentProps<typeof Ionicons>['name']`
  - `ExpiryIngredientRow({ item, onPress })`

- [ ] **Step 1: Create SectionHeader.tsx**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={typography.section}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  action: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
```

- [ ] **Step 2: Create EmptyState.tsx**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { clayShadowSoft } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name={icon} size={32} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...clayShadowSoft,
  },
  title: {
    ...typography.section,
    fontSize: 17,
    textAlign: 'center',
  },
  description: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
```

`React` 네임스페이스가 필요하면 `import type { ComponentProps } from 'react'`로 `icon: ComponentProps<typeof Ionicons>['name']`를 쓴다.

- [ ] **Step 3: Create ExpiryIngredientRow.tsx**

기존 `IngredientItem`의 status 라벨/색을 홈용으로 단순화:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ingredient, IngredientStatus } from '@/types/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { clayShadowSoft } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ExpiryIngredientRowProps = {
  item: Ingredient;
  onPress: (item: Ingredient) => void;
};

const STATUS_LABEL: Record<'expired' | 'soon', string> = {
  expired: '지남',
  soon: '임박',
};

const STATUS_FG: Record<'expired' | 'soon', string> = {
  expired: colors.danger,
  soon: colors.accent,
};

const STATUS_BG: Record<'expired' | 'soon', string> = {
  expired: colors.dangerSoft,
  soon: colors.accentSoft,
};

export function ExpiryIngredientRow({ item, onPress }: ExpiryIngredientRowProps) {
  const status = item.status as 'expired' | 'soon';
  const date = item.expiration_date?.slice(0, 10) ?? '미설정';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text numberOfLines={1} style={styles.name}>
          {item.ingredient_name}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: STATUS_BG[status] }]}>
        <Text style={[styles.badgeText, { color: STATUS_FG[status] }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...clayShadowSoft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  left: { flex: 1, gap: 2 },
  name: { ...typography.body, fontWeight: '700' },
  date: typography.caption,
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.label },
});
```

`IngredientStatus`를 import만 하고 안 쓰면 제거하고, `status`가 `ok`/`unknown`으로 들어오지 않는다고 가정한다(헬퍼가 이미 필터).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add src/components/SectionHeader.tsx src/components/EmptyState.tsx src/components/ExpiryIngredientRow.tsx
git commit -m "$(cat <<'EOF'
Feat: 홈용 SectionHeader·EmptyState·ExpiryIngredientRow 추가

EOF
)"
```

---

### Task 4: Move fridge screen + update tab layout

**Files:**
- Create: `src/app/(main)/(tabs)/fridge.tsx` (copy of current `index.tsx`)
- Modify: `src/app/(main)/(tabs)/_layout.tsx`
- Note: `index.tsx`는 Task 5에서 홈으로 교체. 이 Task에서는 `fridge.tsx` 추가 + `_layout`에 5탭 등록. 잠깐 `index`와 `fridge`가 동일 냉장고 UI여도 됨 — Task 5에서 `index`를 홈으로 바꾼다.

**Interfaces:**
- Consumes: 기존 냉장고 화면 전체
- Produces: 탭 이름 `fridge`, 라벨 `냉장고`, 아이콘 `nutrition-outline`; 홈 자리(`index`)는 임시로 냉장고 유지 또는 placeholder 금지 — **반드시 fridge 파일로 내용 이동 후 layout에 등록**

- [ ] **Step 1: Copy fridge screen**

```bash
cp "src/app/(main)/(tabs)/index.tsx" "src/app/(main)/(tabs)/fridge.tsx"
```

`fridge.tsx` 기본 export 함수명은 `FridgeScreen`으로 바꿔도 되고 유지해도 됨(Expo Router는 default export만 필요).

- [ ] **Step 2: Update `_layout.tsx`**

`Tabs.Screen` 순서를 다음과 같이 맞춘다:

```tsx
<Tabs.Screen
  name="index"
  options={{
    title: '홈',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home-outline" size={size} color={color} />
    ),
  }}
/>
<Tabs.Screen
  name="fridge"
  options={{
    title: '냉장고',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="nutrition-outline" size={size} color={color} />
    ),
  }}
/>
{/* shopping, group, settings — 기존 유지 */}
```

기존 `index`의 `title: '내 냉장고'` / `nutrition-outline`은 제거(홈·냉장고로 분리).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/(tabs)/fridge.tsx" "src/app/(main)/(tabs)/_layout.tsx"
git commit -m "$(cat <<'EOF'
Feat: 냉장고 탭 분리 및 5탭 레이아웃 준비

EOF
)"
```

---

### Task 5: Home screen

**Files:**
- Modify: `src/app/(main)/(tabs)/index.tsx` (전체 교체 → 홈)

**Interfaces:**
- Consumes:
  - `getIngredients('personal')`, `getRecipeRecommendations('personal')`
  - `selectExpiringIngredients`
  - `SectionHeader`, `EmptyState`, `ExpiryIngredientRow`, `RecipeCard`, `Button`
  - `useAuthStore`, `colors`, `spacing`, `radius`, `typography`, `clayShadow`
- Produces: 홈 대시보드 UI + 네비게이션

- [ ] **Step 1: Replace `index.tsx` with Home screen**

핵심 구조(전체 파일로 작성):

```tsx
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { getIngredients } from '@/api/ingredients';
import { getRecipeRecommendations } from '@/api/recipes';
import { EmptyState } from '@/components/EmptyState';
import { ExpiryIngredientRow } from '@/components/ExpiryIngredientRow';
import { RecipeCard } from '@/components/RecipeCard';
import { SectionHeader } from '@/components/SectionHeader';
import { selectExpiringIngredients } from '@/lib/ingredients';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { clayShadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Ingredient, RecipeRecommendation } from '@/types/api';

const INGREDIENTS_KEY = ['ingredients', 'personal'] as const;
const RECIPES_KEY = ['recipes', 'recommendations', 'personal'] as const;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const ingredientsQuery = useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => getIngredients('personal'),
  });

  const recipesQuery = useQuery({
    queryKey: RECIPES_KEY,
    queryFn: () => getRecipeRecommendations('personal'),
  });

  const ingredients = ingredientsQuery.data ?? [];
  const expiring = selectExpiringIngredients(ingredients, 5);
  const recipes = (recipesQuery.data?.recipes ?? []).slice(0, 3);

  const refreshing =
    ingredientsQuery.isRefetching || recipesQuery.isRefetching;

  const onRefresh = () => {
    void ingredientsQuery.refetch();
    void recipesQuery.refetch();
  };

  const onEditIngredient = (item: Ingredient) => {
    router.push({
      pathname: '/(main)/edit-ingredient',
      params: {
        id: String(item.id),
        name: item.ingredient_name,
        purchase_date: item.purchase_date.slice(0, 10),
        expiration_date: item.expiration_date?.slice(0, 10) ?? '',
        scope: 'personal',
      },
    } as unknown as Href);
  };

  const onRecipePress = (recipe: RecipeRecommendation) => {
    router.push({
      pathname: '/(main)/recipes/detail',
      params: {
        board_name: recipe.board_name,
        author_name: recipe.author_name,
      },
    });
  };

  const initialLoading =
    (ingredientsQuery.isLoading && !ingredientsQuery.data) ||
    (recipesQuery.isLoading && !recipesQuery.data);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerCard}>
            <Text style={styles.greeting}>안녕하세요</Text>
            <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="임박한 식재료"
              actionLabel="냉장고 전체 보기"
              onAction={() => router.push('/(main)/(tabs)/fridge' as Href)}
            />
            {ingredientsQuery.isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="식재료를 불러오지 못했어요"
                description={getErrorMessage(ingredientsQuery.error)}
                actionLabel="다시 시도"
                onAction={() => void ingredientsQuery.refetch()}
              />
            ) : ingredients.length === 0 ? (
              <EmptyState
                icon="snow-outline"
                title="냉장고가 비어 있어요"
                description="식재료를 추가하면 유통기한 임박 알림을 볼 수 있어요."
                actionLabel="식재료 추가"
                onAction={() =>
                  router.push({
                    pathname: '/(main)/add',
                    params: { scope: 'personal' },
                  })
                }
              />
            ) : expiring.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title="유통기한이 임박한 재료가 없어요"
                description="냉장고에 있는 재료는 모두 여유 있어요."
                actionLabel="냉장고 보기"
                onAction={() => router.push('/(main)/(tabs)/fridge' as Href)}
              />
            ) : (
              <View style={styles.listGap}>
                {expiring.map((item) => (
                  <ExpiryIngredientRow
                    key={item.id}
                    item={item}
                    onPress={onEditIngredient}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="추천 레시피"
              actionLabel="더 많은 레시피"
              onAction={() => router.push('/(main)/recipes')}
            />
            {recipesQuery.isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="레시피를 불러오지 못했어요"
                description={getErrorMessage(recipesQuery.error)}
                actionLabel="다시 시도"
                onAction={() => void recipesQuery.refetch()}
              />
            ) : recipes.length === 0 ? (
              <EmptyState
                icon="restaurant-outline"
                title="추천 레시피가 없어요"
                description="식재료를 추가하면 맞춤 레시피를 추천해 드려요."
                actionLabel="식재료 추가"
                onAction={() =>
                  router.push({
                    pathname: '/(main)/add',
                    params: { scope: 'personal' },
                  })
                }
              />
            ) : (
              <View style={styles.listGap}>
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={`${recipe.board_name}-${recipe.author_name}`}
                    recipe={recipe}
                    onPress={() => onRecipePress(recipe)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  headerCard: {
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    ...clayShadow,
  },
  greeting: typography.caption,
  nickname: typography.title,
  section: { gap: spacing.sm },
  listGap: { gap: spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

사용하지 않는 `Pressable` import는 제거한다.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual smoke (시뮬레이터/기기)**

1. 앱 실행 후 하단 탭이 `홈 / 냉장고 / 장보기 / 가족 / 설정`인지 확인  
2. 홈에 인사·임박·추천 섹션이 보이는지 확인  
3. 임박 행 → 수정 화면, 레시피 카드 → 상세, 더보기 → 냉장고/레시피 목록  
4. 당김 새로고침

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/(tabs)/index.tsx"
git commit -m "$(cat <<'EOF'
Feat: 홈 탭 대시보드(임박 식재료·추천 레시피) 추가

EOF
)"
```

---

### Task 6: Fix expiry notification navigation + fridge greeting cleanup

**Files:**
- Modify: `src/app/(main)/notifications.tsx` — `handleExpiryPress`의 `replace` 경로
- Modify: `src/app/(main)/(tabs)/fridge.tsx` — 헤더에 남아 있을 수 있는 홈용 인사와 중복이 거슬리면 유지해도 됨(스펙상 냉장고 UI 변경은 Phase 2). **필수 변경은 notifications 경로뿐.**

- [ ] **Step 1: Update expiry navigation**

`notifications.tsx`에서:

```typescript
router.replace('/(main)/(tabs)/fridge' as Href);
```

(`/(main)/(tabs)`만 쓰면 이제 홈으로 가므로 반드시 `fridge`로.)

- [ ] **Step 2: Grep for stale tab links**

Run: `rg "\(main\)/\(tabs\)'" src` 또는 `rg "\(tabs\)'" src --glob '*.tsx'`

`Redirect`인 `(main)/index.tsx` → `/(main)/(tabs)`(홈)는 로그인 후 홈 진입이므로 **유지**.  
expiry·“냉장고로 이동” 의도인 곳만 `fridge`로 수정.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/notifications.tsx"
git commit -m "$(cat <<'EOF'
Fix: 유통기한 알림 탭 시 냉장고 탭으로 이동

EOF
)"
```

---

## Spec coverage checklist

| Spec 요구 | Task |
|-----------|------|
| spacing / radius / typography | Task 1 |
| selectExpiringIngredients | Task 2 |
| SectionHeader / EmptyState / ExpiryIngredientRow | Task 3 |
| 5탭 + fridge 분리 | Task 4 |
| 홈 대시보드 (임박 5 + 만개 3, personal, 빈/로딩/refresh) | Task 5 |
| expiry 알림 → fridge | Task 6 |
| Phase 2/3, AI, NativeWind | Out of scope |

## Self-review notes

- Query key `['recipes', 'recommendations', 'personal']`는 레시피 화면의 `[...RECIPE_RECOMMENDATIONS_KEY, scope]`와 동일 → 캐시 공유 OK  
- Ingredients key `['ingredients', 'personal']`도 냉장고와 동일  
- `ExpiryIngredientRow`는 헬퍼 통과분(`expired`/`soon`)만 받는다
