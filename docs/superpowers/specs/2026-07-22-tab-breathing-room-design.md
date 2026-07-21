# 탭 화면 여백·호흡감 + 뒤로가기 라벨

날짜: 2026-07-22  
상태: Approved (대화에서 접근안·범위 승인)

## Goal

탭 화면이 **큰 clay 카드로 꽉 찬 단조로운 느낌**을 줄이고, 섹션·여백 중심의 **가벼운 레이아웃**으로 숨 쉬는 인상을 만든다.  
동시에 스택 화면의 뒤로가기 라벨이 `(tabs)`로 노출되는 문제를 고쳐 **`뒤로`**로 표시한다.

## Decisions

| 항목 | 선택 |
|------|------|
| 디자인 방향 | B: 큰 카드 비중 ↓, 섹션·여백 중심 가벼운 레이아웃 |
| 구현 접근 | 2: 헤더 카드 해체 + 리스트 여백 (토큰만 조정·전면 리디자인 제외) |
| 범위 | **탭 5개만** — 홈 / 냉장고 / 장보기 / 가족 / 설정 |
| 뒤로가기 라벨 | `뒤로` (`headerBackTitle`) |
| 팔레트·브랜드 | 기존 emerald clay `colors` 유지. 새 색상 체계 없음 |
| 기능 | API·탭 IA·비즈니스 로직 변경 없음 |

## Out of Scope

- 스택 화면(레시피·알림·식재료 추가/수정·merge 등) 레이아웃 재작업
- NativeWind 전환, 다크모드
- Reanimated / 새 모션 라이브러리
- Clay 팔레트·타이포 스케일 전면 교체
- 컴포넌트 API·라우팅 구조 변경

## Problem

1. **뒤로가기:** `(main)` Stack에서 탭 그룹 이름이 이전 화면 타이틀로 쓰여 iOS 좌상단에 `(tabs)`가 보임.
2. **밀도:** 탭 상단 `headerCard`(큰 surface + clay shadow)와 리스트 행 카드가 화면을 크게 채워 여백·계층이 약함.

## Navigation fix

파일: `src/app/(main)/_layout.tsx`

- `Stack` `screenOptions`에 `headerBackTitle: '뒤로'` 추가.
- `(tabs)` 스크린은 `headerShown: false` 유지. 필요 시 `title`을 넣어도 되지만, 전역 `headerBackTitle`로 충분.

기대 결과: 레시피·알림·merge 등 탭에서 push한 화면의 뒤로 라벨이 `뒤로`.

## Visual direction (탭)

### 원칙

- **한 화면 = 가벼운 헤더 + 숨 쉬는 리스트/섹션.** 상단을 거대한 clay 패널로 닫지 않는다.
- 카드는 **상호작용·내용 단위가 필요할 때만** 유지. 헤더·토글 래퍼용 카드는 제거.
- 그림자·radius는 **soft**로. 리스트 행은 기존 대비 패딩·elevation을 줄인다.
- 섹션·아이템 간격은 `spacing` 토큰을 **상향**해 호흡을 확보한다.

### Token tweaks (최소)

`src/theme/spacing.ts` (또는 탭에서만 상수 사용):

| 용도 | 방향 |
|------|------|
| 화면 좌우 padding | `20–24` 유지 또는 약간 확대 |
| 섹션 간 gap | `xl` → `section`/`xxl` 쪽으로 확대 |
| 리스트 행 separator | `12` → `14–16` |
| 상단 헤더 하단 여백 | 카드 margin 대신 `16–20`의 열린 여백 |

radius/shadow:

- 리스트 행: `clayShadow` → `clayShadowSoft` 또는 shadow 제거 + 약한 border/`primarySoft` 배경
- 남기는 카드(예: 홈 `RecipeCard`): soft shadow, radius `20–24`로 살짝 축소 가능

### Per-tab

#### 홈 `(tabs)/index`

- `headerCard`(surface + shadow) → **플레인 헤더** (인사 + 닉네임만, 배경 없음 또는 투명)
- 섹션(`임박한 식재료` / `추천 레시피`) 사이 gap 확대
- `ExpiryIngredientRow` / `RecipeCard` 사이 gap 확대; 카드 자체는 유지하되 soft shadow 우선

#### 냉장고 `(tabs)/fridge`

- 상단 `headerCard` 해체: 인사·닉네임·개수 pill·`ScopeToggle`을 **세로 스택 + 여백**으로
- 리스트 행(`IngredientItem`): 그림자 약화, separator 확대
- 하단 액션 바 패딩은 유지하되 상단과 시각적으로 분리되도록 여백만 정리

#### 장보기 `(tabs)/shopping`

- 입력/토글이 들어 있는 상단 clay 블록을 **플레인 헤더 + 입력 영역**으로 완화 (필수 입력을 카드로 감쌀 필요는 없음; 필요 시 soft surface만)
- 리스트 간격·행 밀도는 냉장고와 동일 톤

#### 가족 `(tabs)/group`

- 큰 surface 카드 덩어리를 **섹션 헤더 + 폼/리스트**로 풀어 여백 확보
- 멤버 행·초대 블록은 얇게; 섹션 간 간격 확대
- 기능(생성/가입/초대/강퇴 등) UI 위치는 유지

#### 설정 `(tabs)/settings`

- 프로필/비밀번호 등 큰 clay 폼 카드를 **섹션 단위**로 나누거나, 카드 패딩·간격만 늘려 답답함 완화
- 위험 액션(로그아웃·탈퇴) 구분은 기존 색/배치 유지

## Shared components (영향)

탭에서 쓰는 컴포넌트만 밀도 조정. API props는 바꾸지 않는다.

| 컴포넌트 | 변경 |
|----------|------|
| `IngredientItem` | soft shadow / 패딩·radius 축소 |
| `ShoppingItemRow` | 동일 톤 |
| `RecipeCard` / `ExpiryIngredientRow` | soft shadow, gap 여유 |
| `EmptyState` / `EmptyFridge` | 세로 여백만 필요 시 소폭 조정 |
| `ScopeToggle` | 동작 유지; 부모 카드 제거에 맞춰 자체 margin만 |

## Success criteria

- [ ] 탭에서 push한 화면 좌상단이 `(tabs)`가 아니라 `뒤로`
- [ ] 홈·냉장고·장보기 상단에 거대한 clay 헤더 카드가 없음 (또는 동등하게 가벼운 헤더)
- [ ] 리스트/섹션 사이 여백이 이전보다 넓어 숨이 쉬는 인상
- [ ] 탭 기능·네비게이션·API 동작 동일
- [ ] 스택 화면은 의도적으로 이번 범위에서 손대지 않음 (뒤로 라벨 제외)

## Non-goals reminder

“전 앱 clay 리디자인”이 아니라 **탭 호흡감 + 뒤로 라벨**만. 색·브랜드는 유지한다.
