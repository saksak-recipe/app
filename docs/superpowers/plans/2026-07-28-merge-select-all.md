# 가족으로 보내기 전체 선택/해제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가족으로 보내기 화면에서 식재료·장보기 섹션별로 전체 선택/해제 토글을 제공한다.

**Architecture:** `merge.tsx`에 섹션 헤더 행을 두고, 해당 섹션 항목이 모두 선택됐으면 `전체 해제`, 아니면 `전체 선택` 라벨을 보여 준다. 탭 시 해당 섹션의 selected id 배열만 갱신한다. 기존 `mergePersonalIntoGroup` API·백엔드는 그대로 둔다.

**Tech Stack:** Expo (React Native), TypeScript, TanStack Query

**Spec:** `docs/superpowers/specs/2026-07-28-merge-select-all-design.md`

## Global Constraints

- 적용 범위: 식재료 + 장보기 **각각** 섹션 (전역 전체 선택 없음)
- UI: 섹션 제목 오른쪽 텍스트 토글 — 전부 선택이면 `전체 해제`, 아니면 `전체 선택`
- 항목 0개면 토글 숨김
- 부분 선택 + `전체 선택` 탭 → 전부 선택
- 백엔드/API 변경 없음
- 앱 검증: `npx tsc --noEmit` (Jest 없음)

## File Structure

| File | Responsibility |
|------|----------------|
| `src/app/(main)/merge.tsx` | 섹션 헤더 토글 UI + select-all/deselect-all 핸들러 |

---

### Task 1: `merge.tsx` 섹션별 전체 선택/해제

**Files:**
- Modify: `src/app/(main)/merge.tsx`

**Interfaces:**
- Consumes: 기존 `selectedIngredients: number[]`, `selectedShopping: number[]`, `ingredients`, `shopping`
- Produces: `toggleAllIngredients()`, `toggleAllShopping()`, `SectionHeader` (또는 인라인 헤더 행)

- [ ] **Step 1: 헬퍼·핸들러 추가**

`MergeScreen` 안에서 목록 로드 후(또는 `ingredients`/`shopping` 선언 직후) 다음을 추가한다.

```tsx
const allIngredientsSelected =
  ingredients.length > 0 &&
  ingredients.every((item) => selectedIngredients.includes(item.id));

const allShoppingSelected =
  shopping.length > 0 &&
  shopping.every((item) => selectedShopping.includes(item.id));

const toggleAllIngredients = () => {
  setSelectedIngredients(
    allIngredientsSelected ? [] : ingredients.map((item) => item.id),
  );
};

const toggleAllShopping = () => {
  setSelectedShopping(
    allShoppingSelected ? [] : shopping.map((item) => item.id),
  );
};
```

- [ ] **Step 2: 섹션 헤더 컴포넌트 추가**

파일 상단 `SelectableItem` 아래에 추가:

```tsx
function SectionHeader({
  title,
  itemCount,
  allSelected,
  onToggleAll,
}: {
  title: string;
  itemCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {itemCount > 0 ? (
        <Pressable onPress={onToggleAll} hitSlop={8}>
          <Text style={styles.selectAllText}>
            {allSelected ? '전체 해제' : '전체 선택'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 3: 식재료·장보기 섹션 제목을 `SectionHeader`로 교체**

기존:

```tsx
<Text style={styles.sectionTitle}>식재료</Text>
```

교체:

```tsx
<SectionHeader
  title="식재료"
  itemCount={ingredients.length}
  allSelected={allIngredientsSelected}
  onToggleAll={toggleAllIngredients}
/>
```

기존:

```tsx
<Text style={styles.sectionTitle}>장보기</Text>
```

교체:

```tsx
<SectionHeader
  title="장보기"
  itemCount={shopping.length}
  allSelected={allShoppingSelected}
  onToggleAll={toggleAllShopping}
/>
```

방식(복사/이동) 섹션 제목은 그대로 `Text`로 둔다.

- [ ] **Step 4: 스타일 추가·조정**

`StyleSheet`에 추가하고, `sectionTitle`의 `marginTop`은 헤더 행으로 옮긴다.

```tsx
sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 8,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: colors.text,
},
selectAllText: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.primary,
},
```

기존 `sectionTitle`에 있던 `marginTop: 8`은 제거한다 (`sectionHeader`가 담당).

- [ ] **Step 5: 타입 체크**

Run (app 루트):

```bash
npx tsc --noEmit
```

Expected: exit 0, 에러 없음

- [ ] **Step 6: 수동 확인 (가능하면)**

1. 식재료만 있을 때 `전체 선택` → 전부 체크, 라벨 `전체 해제`
2. `전체 해제` → 전부 해제
3. 하나 체크 후 `전체 선택` → 전부 체크
4. 장보기 섹션도 동일·독립 동작
5. 빈 섹션에는 토글 없음
6. 보내기(복사)가 기존처럼 동작

- [ ] **Step 7: Commit**

```bash
git add src/app/\(main\)/merge.tsx
git commit -m "$(cat <<'EOF'
Feat: 가족으로 보내기에 섹션별 전체 선택/해제 추가

EOF
)"
```

---

## Spec Coverage Checklist

| Spec 요구 | Task |
|-----------|------|
| 식재료·장보기 각각 토글 | Task 1 |
| 전부 선택 ↔ 전체 해제 라벨 | Task 1 Step 1–2 |
| 항목 0개면 숨김 | Task 1 Step 2 (`itemCount > 0`) |
| 부분 선택 → 전체 선택 시 전부 | Task 1 Step 1 (`map` 전체 id) |
| 백엔드 변경 없음 | (파일 구조에 back 없음) |
| 개별 체크·보내기 유지 | Task 1 (기존 toggle/mutate 유지) |
