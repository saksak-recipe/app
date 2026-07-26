# Soft UI Weight Softening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전역 타이포·radius·Button/카드/행의 무게감을 Soft UI로 완화해 딱딱한 인상을 줄인다. 팔레트·레이아웃 구조·기능은 유지한다.

**Architecture:** `typography`/`radius` 토큰을 먼저 완화한 뒤, `Button`·`TextField`·공유 카드/행 컴포넌트를 soft 규칙에 맞춘다. 탭바·스택 헤더 chrome을 같은 굵기로 맞추고, 탭→스택→인증 화면의 인라인 `fontWeight: '800'`과 `clayShadow`를 정리한다. API·라우팅·props는 변경하지 않는다.

**Tech Stack:** Expo Router 57, React Native, TypeScript, StyleSheet, 기존 clay theme (`colors` / `spacing` / `shadows` / `radius` / `typography`)

**Spec:** `docs/superpowers/specs/2026-07-26-soft-ui-weight-design.md`

## Global Constraints

- 팔레트(`colors`) 변경 없음 / 커스텀 폰트·NativeWind·다크모드·Reanimated 없음
- 레이아웃 구조(breathing-room 플레인 헤더·여백) 유지 — weight / shadow / radius / 버튼 fill만 변경
- 컴포넌트 props·API·탭 IA·비즈니스 로직 변경 없음
- `fontWeight: '800'` 제거(또는 문서화된 예외 없음 — 전부 제거)
- Primary 버튼: LinearGradient 제거, `colors.primary` 단색, `minHeight: 48`
- 리스트 행: 강한 `clayShadow` 금지 → soft 또는 border
- 검증: `npx tsc --noEmit` (Jest UI 테스트 없음). 각 Task Verify는 수동/타입체크

## File Structure

| File | Responsibility |
|------|----------------|
| `src/theme/typography.ts` | title/section/caption/label weight·size |
| `src/theme/radius.ts` | sm–card +2~4 |
| `src/components/Button.tsx` | 높이 48, 단색 primary, label 600 |
| `src/components/TextField.tsx` | minHeight 48, radius 토큰 |
| `src/components/RecipeCard.tsx` | soft weight |
| `src/components/SavedRecipeCard.tsx` | soft shadow + weight |
| `src/components/ExpiryIngredientRow.tsx` | border/soft + weight |
| `src/components/IngredientItem.tsx` | border/soft + weight |
| `src/components/ShoppingItemRow.tsx` | border/soft + weight |
| `src/components/NotificationRow.tsx` | weight |
| `src/components/ScopeToggle.tsx` | 700/800 → 600 |
| `src/components/SectionHeader.tsx` | action 600 |
| `src/components/EmptyFridge.tsx` | weight |
| `src/components/NotificationBell.tsx` | weight |
| `src/app/(main)/(tabs)/_layout.tsx` | tab/header 600 |
| `src/app/(main)/_layout.tsx` | headerTitle 600 |
| 탭·스택·인증 `*.tsx` | 인라인 800 / clayShadow 정리 |

---

### Task 1: Typography + radius tokens

**Files:**
- Modify: `src/theme/typography.ts`
- Modify: `src/theme/radius.ts`

**Interfaces:**
- Produces: `typography.title.fontWeight === '700'`, `typography.section.fontWeight === '600'`, `typography.section.fontSize === 17`, `typography.caption.fontWeight === '400'`, `typography.label.fontWeight === '600'`; radius 값 상향
- Consumes: 없음

- [ ] **Step 1: Update typography**

`src/theme/typography.ts` 전체를 아래로 교체:

```typescript
import { type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  section: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
} as const;
```

- [ ] **Step 2: Bump radius**

`src/theme/radius.ts`:

```typescript
export const radius = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 26,
  card: 30,
  pill: 999,
} as const;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/theme/typography.ts src/theme/radius.ts
git commit -m "$(cat <<'EOF'
Style: Soft UI용 typography·radius 토큰 완화

EOF
)"
```

---

### Task 2: Button + TextField

**Files:**
- Modify: `src/components/Button.tsx`
- Modify: `src/components/TextField.tsx`

**Interfaces:**
- Consumes: `colors.primary`, `clayShadowSoft`, `radius` (TextField에서 radius.md 또는 18→20 근사)
- Produces: Primary Button 단색·높이 48·라벨 600; TextField `minHeight: 48`

- [ ] **Step 1: Soften Button**

`src/components/Button.tsx`를 아래로 교체 (LinearGradient 제거):

```tsx
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { clayShadowSoft } from '@/theme/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        variant !== 'ghost' && clayShadowSoft,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost'
              ? colors.primary
              : variant === 'danger'
                ? colors.danger
                : '#fff'
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            (variant === 'secondary' || variant === 'ghost') && styles.labelDark,
            variant === 'danger' && styles.labelDanger,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  labelDark: {
    color: colors.primaryDark,
  },
  labelDanger: {
    color: colors.danger,
  },
});
```

- [ ] **Step 2: Soften TextField height + radius**

`src/components/TextField.tsx`의 `inputShell.borderRadius`와 `input.minHeight`만 변경:

```typescript
  inputShell: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...clayShadowSoft,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/components/Button.tsx src/components/TextField.tsx
git commit -m "$(cat <<'EOF'
Style: Button 단색·높이 완화 및 TextField 높이 맞춤

EOF
)"
```

---

### Task 3: Shared cards, rows, chrome helpers

**Files:**
- Modify: `src/components/RecipeCard.tsx`
- Modify: `src/components/SavedRecipeCard.tsx`
- Modify: `src/components/ExpiryIngredientRow.tsx`
- Modify: `src/components/IngredientItem.tsx`
- Modify: `src/components/ShoppingItemRow.tsx`
- Modify: `src/components/NotificationRow.tsx`
- Modify: `src/components/ScopeToggle.tsx`
- Modify: `src/components/SectionHeader.tsx`
- Modify: `src/components/EmptyFridge.tsx`
- Modify: `src/components/NotificationBell.tsx`

**Interfaces:**
- Consumes: `clayShadowSoft`, `colors.border`, `radius`, `typography`
- Produces: 공유 UI soft weight/shadow 규칙

- [ ] **Step 1: RecipeCard weights**

`src/components/RecipeCard.tsx` StyleSheet에서:

- `name.fontWeight`: `'800'` → `'700'`
- `difficultyText.fontWeight`: `'700'` → `'600'`
- `time.fontWeight`: `'700'` → `'600'`
- `card.borderRadius`: `20` → `22` (선택, radius 상향과 맞춤)
- shadow는 이미 soft면 유지

- [ ] **Step 2: SavedRecipeCard soft**

`src/components/SavedRecipeCard.tsx`:

- `import { clayShadow }` → `import { clayShadowSoft }`
- 스타일 스프레드 `...clayShadow` → `...clayShadowSoft`
- 제목 `fontWeight: '800'` → `'700'`
- 기타 `fontWeight: '700'` → `'600'`

- [ ] **Step 3: List rows — border over heavy shadow**

`ExpiryIngredientRow.tsx` / `IngredientItem.tsx` / `ShoppingItemRow.tsx` 공통 규칙:

```typescript
// row 스타일 예시
{
  backgroundColor: colors.surface,
  borderRadius: radius.xl, // 또는 기존 값
  borderWidth: 1,
  borderColor: colors.border,
  // clayShadowSoft 제거 또는 유지해도 됨 — 스펙: soft 또는 border. 둘 다면 soft 제거 권장
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
}
```

- 이름/배지 `fontWeight: '700'` → `'600'`
- `ExpiryIngredientRow`의 `name: { ...typography.body, fontWeight: '700' }` → `fontWeight: '600'`

`NotificationRow.tsx`: `fontWeight: '700'` → `'600'`

- [ ] **Step 4: ScopeToggle + SectionHeader + EmptyFridge + NotificationBell**

`ScopeToggle.tsx`:

```typescript
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
```

`SectionHeader.tsx` action:

```typescript
  action: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
```

`EmptyFridge.tsx` / `NotificationBell.tsx`: `fontWeight: '700'` → `'600'`

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/components/RecipeCard.tsx src/components/SavedRecipeCard.tsx \
  src/components/ExpiryIngredientRow.tsx src/components/IngredientItem.tsx \
  src/components/ShoppingItemRow.tsx src/components/NotificationRow.tsx \
  src/components/ScopeToggle.tsx src/components/SectionHeader.tsx \
  src/components/EmptyFridge.tsx src/components/NotificationBell.tsx
git commit -m "$(cat <<'EOF'
Style: 공유 카드·행·토글 Soft UI 무게감 완화

EOF
)"
```

---

### Task 4: Tab bar + stack header chrome

**Files:**
- Modify: `src/app/(main)/(tabs)/_layout.tsx`
- Modify: `src/app/(main)/_layout.tsx`

**Interfaces:**
- Consumes: `colors`
- Produces: header/tab label weight 600

- [ ] **Step 1: Tabs layout**

`src/app/(main)/(tabs)/_layout.tsx` `screenOptions`:

```tsx
headerTitleStyle: { fontWeight: '600', color: colors.text },
tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
```

- [ ] **Step 2: Main stack layout**

`src/app/(main)/_layout.tsx`:

```tsx
headerTitleStyle: { fontWeight: '600', color: colors.text },
```

(`headerBackTitle: '뒤로'` 유지)

- [ ] **Step 3: Typecheck + Commit**

Run: `npx tsc --noEmit`  
Expected: exit 0

```bash
git add src/app/\(main\)/\(tabs\)/_layout.tsx src/app/\(main\)/_layout.tsx
git commit -m "$(cat <<'EOF'
Style: 탭바·스택 헤더 타이틀 굵기 완화

EOF
)"
```

---

### Task 5: Tab screens inline cleanup

**Files:**
- Modify: `src/app/(main)/(tabs)/fridge.tsx`
- Modify: `src/app/(main)/(tabs)/shopping.tsx`
- Modify: `src/app/(main)/(tabs)/group.tsx`
- Modify: `src/app/(main)/(tabs)/settings.tsx`
- Modify: `src/app/(main)/(tabs)/index.tsx` (인라인 800이 있으면만)

**Interfaces:**
- Consumes: Task 1–3 토큰/컴포넌트
- Produces: 탭 화면 soft weight

- [ ] **Step 1: Replace weights in each tab file**

규칙 (파일별 StyleSheet / 인라인):

| From | To |
|------|-----|
| `fontWeight: '800'` | `'700'` (화면 타이틀) 또는 `'600'` (섹션/강조 라벨) |
| `fontWeight: '700'` (본문·칩·멤버명 등) | `'600'` |
| `...clayShadow` | `...clayShadowSoft` (탭에 남아 있으면) |

대표 매핑:

- `fridge.tsx`: 헤더 title `800→700`, `countText` `700→600`, `errorTitle` `700→600`
- `shopping.tsx`: `title` `800→700`, `emptyTitle` `800→700`, `errorTitle` `700→600`
- `group.tsx`: `title`/`code`/`invite` 계열 `800→700`, `memberName`/`kickText`/`inviteName` `700→600`
- `settings.tsx`: `title`/`section` `800→700`, 행 라벨 `700→600`
- `index.tsx`: `typography`만 쓰면 추가 변경 없을 수 있음 — `800` 검색 후 없으면 스킵

- [ ] **Step 2: Verify no 800 left in tabs**

Run:

```bash
rg "fontWeight:\s*'800'" "src/app/(main)/(tabs)" || true
```

Expected: no matches

- [ ] **Step 3: Typecheck + Commit**

Run: `npx tsc --noEmit`  
Expected: exit 0

```bash
git add src/app/\(main\)/\(tabs\)/
git commit -m "$(cat <<'EOF'
Style: 탭 화면 인라인 타이포 Soft UI 정리

EOF
)"
```

---

### Task 6: Stack screens inline cleanup

**Files:**
- Modify: `src/app/(main)/recipes/index.tsx`
- Modify: `src/app/(main)/recipes/detail.tsx`
- Modify: `src/app/(main)/recipes/saved.tsx`
- Modify: `src/app/(main)/notifications.tsx`
- Modify: `src/app/(main)/add.tsx`
- Modify: `src/app/(main)/edit-ingredient.tsx`
- Modify: `src/app/(main)/merge.tsx`

**Interfaces:**
- Consumes: `clayShadowSoft`, soft weight 규칙
- Produces: 스택 화면 soft 톤

- [ ] **Step 1: Weight + shadow pass**

각 파일에서:

1. `import { clayShadow }` / `clayShadow, clayShadowSoft` → soft만 쓰도록 import 정리
2. `...clayShadow` → `...clayShadowSoft`
3. `fontWeight: '800'` → `'700'`
4. 카드/칩/버튼성 `fontWeight: '700'` → `'600'` (헤더 화면 타이틀이 인라인이면 `700` 유지 가능)

`recipes/detail.tsx`는 `800`이 여러 곳 — 전부 `'700'`으로, 보조 라벨은 `'600'`.

`add.tsx` / `edit-ingredient.tsx` / `merge.tsx` 폼 카드 shadow도 soft.

- [ ] **Step 2: Verify**

```bash
rg "fontWeight:\s*'800'|clayShadow[^S]" "src/app/(main)/recipes" "src/app/(main)/notifications.tsx" "src/app/(main)/add.tsx" "src/app/(main)/edit-ingredient.tsx" "src/app/(main)/merge.tsx" || true
```

Expected: `fontWeight: '800'` 없음. `clayShadow`는 `clayShadowSoft`만 (또는 shadows.ts 정의 외 사용 없음).

- [ ] **Step 3: Typecheck + Commit**

Run: `npx tsc --noEmit`  
Expected: exit 0

```bash
git add src/app/\(main\)/recipes src/app/\(main\)/notifications.tsx \
  src/app/\(main\)/add.tsx src/app/\(main\)/edit-ingredient.tsx src/app/\(main\)/merge.tsx
git commit -m "$(cat <<'EOF'
Style: 스택 화면 Soft UI 타이포·그림자 정리

EOF
)"
```

---

### Task 7: Auth screens inline cleanup

**Files:**
- Modify: `src/app/(auth)/login.tsx`
- Modify: `src/app/(auth)/signup.tsx`
- Modify: `src/app/(auth)/verify-email.tsx`
- Modify: `src/app/(auth)/password-reset.tsx`
- Modify: `src/app/(auth)/kakao-profile.tsx`
- Check: `src/app/(auth)/_layout.tsx` (header weight 있으면 600)

**Interfaces:**
- Consumes: soft Button/TextField (Task 2), soft shadow
- Produces: 인증 화면 톤 통일

- [ ] **Step 1: Soften each auth screen**

규칙:

- `fontWeight: '800'` → `'700'` (브랜드/타이틀)
- `...clayShadow` → `...clayShadowSoft` (import도 soft로)
- 링크/보조 `fontWeight: '700'` → `'600'`
- `login.tsx`에 로컬 `minHeight: 54` 버튼 스타일이 있으면 `48`로 (공용 Button 미사용 구간)

- [ ] **Step 2: Repo-wide 800 / hard clayShadow sweep**

```bash
rg "fontWeight:\s*'800'" src || true
rg "clayShadow[^S]" src --glob '!**/shadows.ts' || true
rg "LinearGradient" src || true
```

Expected:

- `800` 없음
- `clayShadow` 단독 사용 없음 (`clayShadowSoft`만)
- `LinearGradient` 없음 (Button에서 제거됨). 다른 파일에 남아 있으면 스펙 범위 밖이 아닌 한 soft fill로 교체

- [ ] **Step 3: Final typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "$(cat <<'EOF'
Style: 인증 화면 Soft UI 무게감 완화

EOF
)"
```

---

### Task 8: Final verification

**Files:** 없음 (검증만)

- [ ] **Step 1: Global greps**

```bash
rg "fontWeight:\s*'800'" src || true
rg "from 'expo-linear-gradient'|from \"expo-linear-gradient\"" src || true
rg "\bclayShadow\b" src --glob '!**/shadows.ts' || true
```

Expected: 매치 없음 (`clayShadowSoft` / `shadows.ts`의 export 정의는 제외 — `\bclayShadow\b`가 soft에도 걸릴 수 있으므로 soft만 남았는지 육안 확인: `clayShadow` 단독 import/스프레드만 없어야 함)

더 정확한 체크:

```bash
rg "clayShadow(?!Soft)" src || true
```

Expected: `src/theme/shadows.ts`의 `export const clayShadow` 정의만 (사용처 0). 사용처가 있으면 soft로 교체 후 재검.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual smoke (가능하면)**

- 홈: 인사/섹션 제목이 이전보다 덜 굵은지
- 아무 폼(로그인 또는 추가): Button 높이·단색 primary
- 냉장고 리스트 행: 강한 그림자 없이 border/soft
- 탭 라벨·스택 헤더 굵기

- [ ] **Step 4: No commit unless fixes** — 수정이 있으면 해당 Task로 돌아가 커밋

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| typography title/section/caption/label | 1 |
| radius +2~4 | 1 |
| Button 48 / 단색 / 600 | 2 |
| TextField 48 | 2 |
| Cards soft weight/shadow | 3 |
| List rows border/soft | 3 |
| ScopeToggle / SectionHeader / Empty / Bell | 3 |
| Tab + stack chrome 600 | 4 |
| Tab screens inline | 5 |
| Stack screens inline | 6 |
| Auth screens inline | 7 |
| No 800 / no hard clayShadow / tsc | 7–8 |
| colors·layout·API unchanged | Global Constraints |

## Self-review notes

- Placeholder 없음. 화면 Task는 파일별 규칙 + 대표 매핑으로 구현 가능.
- `clayShadow` export는 `shadows.ts`에 남겨도 됨(미사용). 사용처만 soft로.
- Button에서 `expo-linear-gradient` 의존이 다른 곳에 없으면 package 제거는 **하지 않음** (YAGNI — 다른 용도 가능, package.json 변경은 스펙 밖).
