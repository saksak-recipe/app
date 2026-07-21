# Tab Breathing Room + Back Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탭 5개에서 큰 clay 헤더 카드를 해체하고 섹션·리스트 여백을 넓혀 숨 쉬는 레이아웃으로 바꾸며, 스택 뒤로가기 라벨을 `뒤로`로 고친다.

**Architecture:** `(main)` Stack에 `headerBackTitle: '뒤로'`를 전역 적용. 공유 리스트/카드 컴포넌트는 `clayShadow` → `clayShadowSoft`와 작은 radius로 밀도를 낮춘다. 각 탭 화면의 `headerCard`/`card` 래퍼를 플레인 헤더·섹션 블록으로 교체하고 `spacing` 토큰으로 간격을 상향한다. API·라우팅·props는 변경하지 않는다.

**Tech Stack:** Expo Router 57, React Native, TypeScript, StyleSheet, 기존 clay theme (`colors` / `spacing` / `shadows` / `radius`)

**Spec:** `docs/superpowers/specs/2026-07-22-tab-breathing-room-design.md`

## Global Constraints

- 범위: 탭 5개만 (홈 / 냉장고 / 장보기 / 가족 / 설정) + Stack 뒤로 라벨
- 뒤로가기 문구: 정확히 `뒤로` (`headerBackTitle`)
- 팔레트·브랜드 색 변경 없음 / NativeWind·다크모드·Reanimated 없음
- 컴포넌트 props·API·탭 IA 변경 없음
- 스택 화면(레시피·알림·add/edit 등) 레이아웃 비범위 (뒤로 라벨만 영향)
- 검증: `npx tsc --noEmit` (Jest 없음). 수동 확인은 각 Task Verify

## File Structure

| File | Responsibility |
|------|----------------|
| `src/app/(main)/_layout.tsx` | `headerBackTitle: '뒤로'` |
| `src/theme/spacing.ts` | `section` 상향 (28 → 32) |
| `src/components/IngredientItem.tsx` | soft shadow / 얇은 행 |
| `src/components/ShoppingItemRow.tsx` | soft shadow / 얇은 행 |
| `src/components/RecipeCard.tsx` | soft shadow / radius 축소 |
| `src/components/EmptyState.tsx` | 세로 여백 소폭 확대 |
| `src/app/(main)/(tabs)/index.tsx` | 홈: 플레인 헤더 + 섹션 gap |
| `src/app/(main)/(tabs)/fridge.tsx` | 냉장고: 헤더 카드 해체 |
| `src/app/(main)/(tabs)/shopping.tsx` | 장보기: 헤더 카드 해체 |
| `src/app/(main)/(tabs)/group.tsx` | 가족: 섹션 분리·여백 |
| `src/app/(main)/(tabs)/settings.tsx` | 설정: 섹션 분리·여백 |

`ExpiryIngredientRow`는 이미 `clayShadowSoft` — 이번 플랜에서 수정하지 않음.

---

### Task 1: Back label + spacing token

**Files:**
- Modify: `src/app/(main)/_layout.tsx`
- Modify: `src/theme/spacing.ts`

**Interfaces:**
- Produces: `spacing.section === 32`
- Consumes: 없음

- [ ] **Step 1: Add `headerBackTitle` to main Stack**

`src/app/(main)/_layout.tsx`의 `screenOptions`에 한 줄 추가:

```tsx
screenOptions={{
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.primaryDark,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerBackTitle: '뒤로',
  contentStyle: { backgroundColor: colors.bg },
}}
```

- [ ] **Step 2: Bump `spacing.section`**

`src/theme/spacing.ts`:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
} as const;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Manual verify (뒤로 라벨)**

앱에서 홈 → 레시피(또는 알림)로 이동. iOS 좌상단이 `(tabs)`가 아니라 `뒤로`인지 확인.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/_layout.tsx src/theme/spacing.ts
git commit -m "$(cat <<'EOF'
Fix: 스택 뒤로가기 라벨을 뒤로로 통일하고 section spacing 상향

EOF
)"
```

---

### Task 2: Shared list/card density

**Files:**
- Modify: `src/components/IngredientItem.tsx`
- Modify: `src/components/ShoppingItemRow.tsx`
- Modify: `src/components/RecipeCard.tsx`
- Modify: `src/components/EmptyState.tsx`

**Interfaces:**
- Consumes: `clayShadowSoft` from `@/theme/shadows`, `radius` / `spacing` where already used
- Produces: 동일 named exports (`IngredientItem`, `ShoppingItemRow`, `RecipeCard`, `EmptyState`) — props 시그니처 변경 없음

- [ ] **Step 1: Soften `IngredientItem` row**

`clayShadow` import를 `clayShadowSoft`로 바꾸고 styles:

```tsx
import { clayShadowSoft } from '@/theme/shadows';

// styles.row
row: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  backgroundColor: colors.surface,
  borderRadius: 20,
  paddingVertical: 14,
  paddingHorizontal: 14,
  ...clayShadowSoft,
},
```

- [ ] **Step 2: Soften `ShoppingItemRow` row**

동일하게 `clayShadowSoft`, radius `20`, padding 유지(이미 14) 또는 `paddingVertical: 12`:

```tsx
import { clayShadowSoft } from '@/theme/shadows';

row: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  backgroundColor: colors.surface,
  borderRadius: 20,
  paddingVertical: 12,
  paddingHorizontal: 14,
  ...clayShadowSoft,
},
```

- [ ] **Step 3: Soften `RecipeCard`**

```tsx
import { clayShadowSoft } from '@/theme/shadows';

card: {
  backgroundColor: colors.surface,
  borderRadius: 20,
  padding: 16,
  gap: 8,
  ...clayShadowSoft,
},
```

- [ ] **Step 4: Extra vertical air on `EmptyState`**

```tsx
wrap: {
  alignItems: 'center',
  paddingVertical: spacing.section,
  paddingHorizontal: spacing.lg,
  gap: spacing.sm,
},
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/components/IngredientItem.tsx src/components/ShoppingItemRow.tsx src/components/RecipeCard.tsx src/components/EmptyState.tsx
git commit -m "$(cat <<'EOF'
Style: 탭 공유 리스트·카드 그림자와 밀도를 soft로 완화

EOF
)"
```

---

### Task 3: Home tab plain header + section gaps

**Files:**
- Modify: `src/app/(main)/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `spacing` (`section`, `lg`, `xxl`), `typography`, `colors` — `clayShadow` / `radius` 헤더에서 제거
- Produces: 동일 화면 export, 라우팅·query 로직 불변

- [ ] **Step 1: Replace header card styles and content gap**

JSX의 `styles.headerCard`는 유지하되 스타일만 플레인으로. `clayShadow` / `radius` import가 헤더 전용이면 제거.

```tsx
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.section,
  },
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  greeting: typography.caption,
  nickname: typography.title,
  section: { gap: spacing.md },
  listGap: { gap: spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

JSX에서 `styles.headerCard` → `styles.header`:

```tsx
<View style={styles.header}>
  <Text style={styles.greeting}>안녕하세요</Text>
  <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
</View>
```

사용하지 않는 `clayShadow` / `radius` import 삭제.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual verify**

홈 상단에 흰 clay 패널이 없고, 임박/레시피 섹션 사이가 이전보다 넓어 보이는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/\(tabs\)/index.tsx
git commit -m "$(cat <<'EOF'
Style: 홈 탭 헤더 카드 해체와 섹션 여백 확대

EOF
)"
```

---

### Task 4: Fridge tab plain header

**Files:**
- Modify: `src/app/(main)/(tabs)/fridge.tsx`

**Interfaces:**
- Consumes: `spacing` 토큰 도입 권장; `ScopeToggle` props 불변
- Produces: 동일 화면 동작

- [ ] **Step 1: Flatten header JSX + styles**

`headerCard` View를 플레인 헤더로 교체. `clayShadow` import 제거. `spacing` import 추가.

```tsx
import { spacing } from '@/theme/spacing';

// JSX
<View style={styles.header}>
  <View>
    <Text style={styles.greeting}>안녕하세요</Text>
    <Text style={styles.nickname}>{user?.nickname ?? '회원'}님</Text>
  </View>
  <View style={styles.countPill}>
    <Text style={styles.countText}>식재료 {items.length}개</Text>
  </View>
  {hasGroup ? (
    <ScopeToggle
      scope={scope}
      onChange={setScope}
      disabled={groupQuery.isLoading}
    />
  ) : null}
</View>
```

스타일 교체:

```tsx
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  greeting: { fontSize: 14, color: colors.textMuted },
  nickname: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  countText: { fontSize: 13, fontWeight: '700', color: colors.accent },
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
    gap: spacing.md,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  errorDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  full: { width: '100%' },
  half: { flex: 1 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual verify**

냉장고 상단 clay 카드 없음, ScopeToggle·개수 pill·리스트 간격·하단 버튼 동작 유지.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/\(tabs\)/fridge.tsx
git commit -m "$(cat <<'EOF'
Style: 냉장고 탭 헤더 카드 해체와 리스트 간격 확대

EOF
)"
```

---

### Task 5: Shopping tab plain header

**Files:**
- Modify: `src/app/(main)/(tabs)/shopping.tsx`

**Interfaces:**
- Consumes: `spacing`; `TextField` / `Button` / `ScopeToggle` 불변
- Produces: 동일 화면 동작

- [ ] **Step 1: Flatten header — keep title, subtitle, toggle, add row without clay card**

`clayShadow` import 제거, `spacing` 추가.

```tsx
import { spacing } from '@/theme/spacing';

// JSX — headerCard → header
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
```

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual verify**

장보기 상단 clay 패널 없음, 추가·체크·삭제·전체삭제 동작 유지.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/\(tabs\)/shopping.tsx
git commit -m "$(cat <<'EOF'
Style: 장보기 탭 헤더 카드 해체와 리스트 간격 확대

EOF
)"
```

---

### Task 6: Group tab section breathing room

**Files:**
- Modify: `src/app/(main)/(tabs)/group.tsx`

**Interfaces:**
- Consumes: `spacing`, `clayShadowSoft` (섹션 블록이 남을 경우)
- Produces: 동일 mutation·UI 위치, 시각만 분리

- [ ] **Step 1: Split monolithic cards into plain header + section blocks**

가입 전(미가입) 화면: 하나의 큰 `styles.card`를 다음으로 나눔.

```tsx
<ScrollView contentContainerStyle={styles.content}>
  <View style={styles.header}>
    <Text style={styles.title}>가족 그룹</Text>
    <Text style={styles.subtitle}>
      가족과 냉장고와 장보기 목록을 함께 관리해보세요.
    </Text>
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>그룹 만들기</Text>
    {/* TextField + 생성 Button — 기존과 동일 */}
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>초대 코드로 참여</Text>
    {/* TextField + 참여 Button — 기존과 동일 */}
  </View>

  {invites.length > 0 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>받은 초대</Text>
      {/* invites map — 기존과 동일 */}
    </View>
  ) : null}
</ScrollView>
```

가입 후(그룹 있음) 화면: 상단 제목·메타·초대코드를 플레인 헤더로, 관리 폼·멤버·위험 액션을 각각 `styles.section`으로.

```tsx
<View style={styles.header}>
  <Text style={styles.title}>{group.name}</Text>
  <Text style={styles.meta}>멤버 {group.members.length}명</Text>
  <View style={styles.codeBox}>
    <Text style={styles.codeLabel}>초대 코드</Text>
    <Text style={styles.codeValue}>{group.invite_code}</Text>
  </View>
</View>

{isOwner ? (
  <View style={styles.section}>
    {/* rename / invite / rotate — 기존 필드·버튼 */}
  </View>
) : null}

<View style={styles.section}>
  <Text style={styles.sectionTitle}>멤버</Text>
  {/* members map */}
</View>

<View style={styles.section}>
  <Button title="내 항목 가족으로 보내기" ... />
  {/* dissolve or leave */}
</View>
```

스타일:

```tsx
import { clayShadowSoft } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.section,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { gap: spacing.sm },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    ...clayShadowSoft,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  meta: { fontSize: 14, color: colors.textMuted },
  codeBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  codeLabel: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
  codeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  // memberRow, kickBtn, invite* — 기존 값 유지
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.text },
  memberRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  kickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
  },
  kickText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  inviteRow: { gap: 10, paddingVertical: 8 },
  inviteInfo: { gap: 2 },
  inviteName: { fontSize: 16, fontWeight: '700', color: colors.text },
  inviteMeta: { fontSize: 13, color: colors.textMuted },
  inviteActions: { flexDirection: 'row', gap: 8 },
  inviteBtn: { flex: 1 },
});
```

`styles.card` / `clayShadow` 제거. `sectionTitle`의 `marginTop: 8`은 섹션이 분리되므로 제거.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual verify**

미가입·가입 상태 모두에서 생성/참여/초대/멤버/해체·탈퇴 UI가 보이고 동작한다. 섹션 사이 여백이 넓다.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/\(tabs\)/group.tsx
git commit -m "$(cat <<'EOF'
Style: 가족 탭을 섹션 단위로 분리하고 soft 밀도로 완화

EOF
)"
```

---

### Task 7: Settings tab section split

**Files:**
- Modify: `src/app/(main)/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: `spacing`, `clayShadowSoft`
- Produces: 동일 폼·로그아웃·탈퇴 동작

- [ ] **Step 1: Split account card into header + profile + password + danger**

```tsx
import { clayShadowSoft } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';

<ScrollView contentContainerStyle={styles.content}>
  <View style={styles.header}>
    <Text style={styles.title}>내 계정</Text>
    <Text style={styles.email}>{user?.email}</Text>
    <View style={styles.badges}>
      {user?.has_password ? (
        <Text style={styles.badge}>이메일 로그인</Text>
      ) : null}
      {user?.has_kakao ? <Text style={styles.badge}>카카오 연동</Text> : null}
    </View>
  </View>

  <View style={styles.section}>
    <TextField label="닉네임" ... />
    <Button title="닉네임 저장" ... />
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>비밀번호 변경</Text>
    {/* password fields + button + error — 기존과 동일 */}
  </View>

  <View style={styles.section}>
    <Button title="로그아웃" variant="secondary" onPress={onLogout} />
    <Button title="계정 탈퇴" variant="danger" ... />
  </View>
</ScrollView>
```

```tsx
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.section,
  },
  header: { gap: spacing.sm },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    ...clayShadowSoft,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 14 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
```

`clayShadow` / `styles.card` 제거.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Manual verify**

설정에서 닉네임·비밀번호·로그아웃·탈퇴 UI 분리·여백 확인. 기능 동작 동일.

- [ ] **Step 4: Final typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/\(main\)/\(tabs\)/settings.tsx
git commit -m "$(cat <<'EOF'
Style: 설정 탭을 섹션 단위로 분리하고 soft 밀도로 완화

EOF
)"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| `headerBackTitle: '뒤로'` | Task 1 |
| spacing section 상향 | Task 1 |
| IngredientItem / ShoppingItemRow / RecipeCard soft | Task 2 |
| EmptyState 여백 | Task 2 |
| 홈 플레인 헤더 + 섹션 gap | Task 3 |
| 냉장고 헤더 해체 + separator | Task 4 |
| 장보기 헤더 해체 + separator | Task 5 |
| 가족 섹션 분리 | Task 6 |
| 설정 섹션 분리 | Task 7 |
| 스택 화면 레이아웃 비범위 | 전 Task (뒤로만 영향) |
| ExpiryIngredientRow 이미 soft | 수정 없음 (명시) |
