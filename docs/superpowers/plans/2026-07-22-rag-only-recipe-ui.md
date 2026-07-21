# RAG-Only Recipe UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 생성형 AI 레시피 UI/API/타입을 제거하고, 만개의레시피(RAG) 추천과 저장 목록을 별도 Stack 화면으로 분리한다.

**Architecture:** `recipes/index`는 RAG 추천만 담당하고 헤더「저장」으로 `recipes/saved`에 진입한다. `detail`은 만개·저장 스냅샷만 처리한다. AI 클라이언트·타입·분기는 전부 삭제한다.

**Tech Stack:** Expo Router, TanStack Query, TypeScript, React Native StyleSheet, 기존 clay UI (`colors`, `clayShadow`)

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-22-rag-only-recipe-ui-design.md`
- 백엔드 API/스키마 변경 없음
- `SavedRecipeSource`는 `'mangae'`만
- 홈에 저장 섹션·하단 탭 승격 없음
- 검증: `npx tsc --noEmit` + `rg`로 AI 잔여 심볼 확인 (유닛 테스트 러너 없음)
- 커밋 메시지는 기존 저장소 스타일 (`Feat:` / `Fix:` / `Docs:`)

## File map

| File | Role |
|------|------|
| `src/types/api.ts` | AI 타입 삭제, `SavedRecipeSource = 'mangae'` |
| `src/api/recipes.ts` | AI API 함수·타임아웃 삭제 |
| `src/components/SavedRecipeCard.tsx` | 출처 뱃지 제거 |
| `src/app/(main)/recipes/index.tsx` | 추천만 + headerRight「저장」 |
| `src/app/(main)/recipes/saved.tsx` | 저장 목록 화면 (신규) |
| `src/app/(main)/recipes/detail.tsx` | AI 분기 제거 |
| `src/app/(main)/_layout.tsx` | 타이틀·`recipes/saved` 등록 |

---

### Task 1: AI 타입·API 제거

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/api/recipes.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `SavedRecipeSource = 'mangae'`; AI export 심볼 없음

- [ ] **Step 1: `src/types/api.ts`에서 AI 타입 블록 삭제**

`AiRecipeRecommendation`, `AiRecipeRecommendationResponse`, `AiRecipeDetail` 타입 정의 전체를 삭제한다.

- [ ] **Step 2: `SavedRecipeSource`를 mangae만으로 좁힌다**

```ts
export type SavedRecipeSource = 'mangae';
```

- [ ] **Step 3: `src/api/recipes.ts`에서 AI import·함수 삭제**

제거 대상:
- import의 `AiRecipeDetail`, `AiRecipeRecommendationResponse`
- `const AI_REQUEST_TIMEOUT_MS = 60_000;`
- `getAiRecipeRecommendations` 함수 전체
- `getAiRecipeDetail` 함수 전체

유지: `getRecipeRecommendations`, `getRecipeDetail`, saved CRUD, `SAVED_RECIPES_KEY`.

최종 import 블록 예시:

```ts
import { apiClient } from '@/api/client';
import type {
  DataScope,
  RecipeDetail,
  RecipeRecommendationResponse,
  SaveRecipeRequest,
  SavedRecipeDetail,
  SavedRecipeListItem,
  SavedRecipeSource,
  SavedRecipeStatus,
} from '@/types/api';
```

- [ ] **Step 4: 타입 체크 (이 시점엔 아직 UI가 AI를 import하므로 실패할 수 있음 — 기록만)**

Run: `npx tsc --noEmit`
Expected: `recipes/index.tsx` / `detail.tsx` 등에서 삭제된 심볼 관련 에러 가능. Task 2–4에서 해소.

- [ ] **Step 5: Commit**

```bash
git add src/types/api.ts src/api/recipes.ts
git commit -m "$(cat <<'EOF'
Feat: 생성형 AI 레시피 API·타입 제거

백엔드 RAG 전용에 맞춰 SavedRecipeSource를 mangae만 남긴다.
EOF
)"
```

---

### Task 2: SavedRecipeCard 뱃지 제거

**Files:**
- Modify: `src/components/SavedRecipeCard.tsx`

**Interfaces:**
- Consumes: `SavedRecipeListItem` (`source` 필드는 타입에 남을 수 있으나 UI 미사용)
- Produces: 뱃지 없는 `SavedRecipeCard`

- [ ] **Step 1: 출처 뱃지 UI 제거**

`sourceLabel` 변수와 뱃지 `View`를 삭제한다. titleRow는 이름 + 삭제 버튼만:

```tsx
<View style={styles.titleRow}>
  <Text numberOfLines={1} style={styles.name}>
    {recipe.recipe_name}
  </Text>
  <Pressable
    accessibilityLabel="저장 삭제"
    accessibilityRole="button"
    disabled={deleting}
    hitSlop={8}
    onPress={(event) => {
      event.stopPropagation?.();
      onDelete();
    }}
    style={({ pressed }) => [
      styles.deleteButton,
      pressed && styles.deletePressed,
      deleting && styles.deleteDisabled,
    ]}
  >
    <Ionicons color={colors.danger} name="trash-outline" size={20} />
  </Pressable>
</View>
```

- [ ] **Step 2: 미사용 스타일 정리**

`badge`, `badgeText` StyleSheet 항목 삭제. `name`에 `flex: 1`이 없으면 추가해 삭제 버튼이 우측으로 밀리게 한다.

- [ ] **Step 3: Commit**

```bash
git add src/components/SavedRecipeCard.tsx
git commit -m "$(cat <<'EOF'
Feat: 저장 레시피 카드 출처 뱃지 제거

AI/만개 구분 UI를 없애고 이름·메타·삭제만 남긴다.
EOF
)"
```

---

### Task 3: 추천 화면을 RAG 전용으로 슬림화

**Files:**
- Modify: `src/app/(main)/recipes/index.tsx` (사실상 재작성)
- Modify: `src/app/(main)/_layout.tsx` (타이틀만; saved 등록은 Task 4와 함께 해도 됨 — 이 태스크에서는 index title만)

**Interfaces:**
- Consumes: `getRecipeRecommendations`, `RecipeCard`, `ScopeToggle`
- Produces: 탭 없는 추천 목록 + `useNavigation`/`useLayoutEffect`로 headerRight「저장」→ `/(main)/recipes/saved`

- [ ] **Step 1: `recipes/index.tsx`를 추천 전용으로 교체**

세그먼트 탭·AI·저장 분기 전부 제거. 핵심 구조:

```tsx
import { useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import { getRecipeRecommendations } from '@/api/recipes';
import { Button } from '@/components/Button';
import { RecipeCard } from '@/components/RecipeCard';
import { ScopeToggle } from '@/components/ScopeToggle';
import { useScopeStore } from '@/stores/scopeStore';
import { colors } from '@/theme/colors';
import type { RecipeRecommendation } from '@/types/api';

const RECIPE_RECOMMENDATIONS_KEY = ['recipes', 'recommendations'] as const;

export default function RecipeRecommendationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const scope = useScopeStore((state) => state.scope);
  const hasGroup = useScopeStore((state) => state.hasGroup);
  const setScope = useScopeStore((state) => state.setScope);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel="저장한 레시피"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/(main)/recipes/saved')}
          style={{ paddingHorizontal: 4, paddingVertical: 4 }}
        >
          <Text style={{ color: colors.primaryDark, fontSize: 16, fontWeight: '700' }}>
            저장
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const query = useQuery({
    queryKey: [...RECIPE_RECOMMENDATIONS_KEY, scope],
    queryFn: () => getRecipeRecommendations(scope),
  });

  const recipes: RecipeRecommendation[] = query.data?.recipes ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      {hasGroup ? (
        <View style={styles.scopeWrap}>
          <ScopeToggle scope={scope} onChange={setScope} />
        </View>
      ) : null}
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingHint}>냉장고 재료로 레시피를 고르는 중…</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>레시피를 불러오지 못했어요</Text>
          <Text style={styles.errorDesc}>{getErrorMessage(query.error)}</Text>
          <Button
            title="다시 시도"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={recipes}
          keyExtractor={(item) => `${item.board_name}-${item.author_name}`}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>추천할 레시피가 없어요</Text>
              <Text style={styles.emptyDescription}>
                식재료를 추가하면 맞춤 레시피를 추천해 드릴게요.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() =>
                router.push({
                  pathname: '/(main)/recipes/detail',
                  params: {
                    board_name: item.board_name,
                    author_name: item.author_name,
                  },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}
```

스타일은 기존 `safe` / `scopeWrap` / `list` / `separator` / `center` / `loadingHint` / `error*` / `empty*`를 유지하고, `tabs` / `tab*` 스타일은 삭제한다.

- [ ] **Step 2: `_layout.tsx`에서 추천 화면 타이틀 변경**

```tsx
<Stack.Screen name="recipes/index" options={{ title: '만개의레시피' }} />
```

(`recipes/saved` 등록은 Task 4에서 추가.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/recipes/index.tsx" "src/app/(main)/_layout.tsx"
git commit -m "$(cat <<'EOF'
Feat: 레시피 추천 화면을 RAG 전용으로 슬림화

세그먼트 탭을 제거하고 헤더에서 저장 목록으로 진입한다.
EOF
)"
```

---

### Task 4: `recipes/saved` 화면 추가

**Files:**
- Create: `src/app/(main)/recipes/saved.tsx`
- Modify: `src/app/(main)/_layout.tsx`

**Interfaces:**
- Consumes: `listSavedRecipes`, `deleteSavedRecipe`, `SAVED_RECIPES_KEY`, `SavedRecipeCard`
- Produces: 라우트 `/(main)/recipes/saved`

- [ ] **Step 1: `saved.tsx` 생성**

기존 `index.tsx`의 저장 탭 로직을 이관:

```tsx
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
```

- [ ] **Step 2: `_layout.tsx`에 화면 등록**

```tsx
<Stack.Screen name="recipes/index" options={{ title: '만개의레시피' }} />
<Stack.Screen name="recipes/saved" options={{ title: '저장한 레시피' }} />
<Stack.Screen name="recipes/detail" options={{ title: '레시피 상세' }} />
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/recipes/saved.tsx" "src/app/(main)/_layout.tsx"
git commit -m "$(cat <<'EOF'
Feat: 저장 레시피 전용 화면 추가

추천과 저장 목록을 별도 Stack 라우트로 분리한다.
EOF
)"
```

---

### Task 5: 상세 화면 AI 분기 제거

**Files:**
- Modify: `src/app/(main)/recipes/detail.tsx`

**Interfaces:**
- Consumes: `getRecipeDetail`, saved APIs; `SavedRecipeSource = 'mangae'`
- Produces: `source=ai` / `recipe_id` 없는 상세 화면

- [ ] **Step 1: import에서 AI 제거**

`getAiRecipeDetail` import 삭제.

- [ ] **Step 2: params·분기 단순화**

- `recipe_id` param 파싱 제거 (또는 파싱해도 미사용)
- `isAi` 변수 삭제
- `aiQuery` 삭제
- `saveSource` / `saveSourceId`:

```tsx
const saveSource: SavedRecipeSource | null = isSavedView
  ? (savedQuery.data?.source ?? null)
  : 'mangae';
const saveSourceId = isSavedView
  ? (savedQuery.data?.source_id ?? null)
  : boardName && authorName
    ? `${boardName}|${authorName}`
    : null;
```

- mangaeQuery `enabled`: `!isSavedView && Boolean(boardName && authorName)`
- 잘못된 진입 가드:

```tsx
if (isSavedView && !savedId) {
  return <DetailError message="해당 레시피를 찾지 못했어요" />;
}
if (!isSavedView && (!boardName || !authorName)) {
  return <DetailError message="해당 레시피를 찾지 못했어요" />;
}

const detailQuery = isSavedView ? savedQuery : mangaeQuery;
```

- DisplayRecipe 매핑에서 `if (isAi) { ... }` 블록 삭제. 저장 / 만개만 남김.

- [ ] **Step 3: `tsc`로 타입 확인**

Run: `npx tsc --noEmit`
Expected: PASS (exit 0)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/recipes/detail.tsx"
git commit -m "$(cat <<'EOF'
Feat: 레시피 상세에서 AI 소스 분기 제거

만개 원본과 저장 스냅샷만 남긴다.
EOF
)"
```

---

### Task 6: 잔여 AI 심볼 검증

**Files:**
- Verify only (필요 시 누락 수정)

- [ ] **Step 1: AI 레시피 잔여물 검색**

Run:

```bash
rg -n "getAiRecipe|AiRecipe|/recipes/ai|source === 'ai'|source: 'ai'|RecipeSourceTab|'ai'" src --glob '*.{ts,tsx}'
```

Expected: 매치 없음 (또는 `SavedRecipeSource`/`source=saved` 등 무관한 매치만). `'ai'` 단독 검색은 오탐이 많으므로 위 패턴을 사용.

- [ ] **Step 2: 최종 타입체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 수동 체크리스트 (디바이스/시뮬레이터)**

1. 홈「더 많은 레시피」→ 만개의레시피 목록 (탭 없음)
2. 헤더「저장」→ 저장한 레시피 목록
3. 추천 카드 → 상세 → 저장/해제
4. 저장 목록 → 상세 → 해제 시 목록으로 back
5. 저장 목록 삭제 아이콘 동작
6. 가족 그룹 있을 때 ScopeToggle 동작

- [ ] **Step 4: 잔여 수정이 있으면 커밋, 없으면 스킵**

```bash
# 수정이 있는 경우만
git add -A src
git commit -m "$(cat <<'EOF'
Fix: RAG 전용 레시피 UI 잔여 AI 참조 정리
EOF
)"
```

---

## Spec coverage checklist

| Spec 요구 | Task |
|-----------|------|
| AI API/타입 삭제 | Task 1 |
| SavedRecipeSource mangae만 | Task 1 |
| SavedRecipeCard 뱃지 제거 | Task 2 |
| recipes/index 추천만 + 헤더 저장 | Task 3 |
| recipes/saved 신규 | Task 4 |
| layout 타이틀·등록 | Task 3–4 |
| detail AI 분기 제거 | Task 5 |
| src에 AI 심볼 없음 | Task 6 |
| 홈 변경 없음 | (명시적 no-op) |

## Self-review notes

- Placeholder 없음; 각 단계에 교체 코드·명령·Expected 포함
- 유닛 테스트 러너 없음 → `tsc` + `rg` + 수동 체크리스트로 대체 (프로젝트 관례)
- Task 1 직후 `tsc` 실패는 예상됨; Task 5 이후 PASS가 게이트
