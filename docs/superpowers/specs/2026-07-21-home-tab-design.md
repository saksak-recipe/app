# 홈 탭 + 디자인 고도화 (Phase 1)

날짜: 2026-07-21  
상태: Approved (대화에서 섹션별 승인 완료)

## Goal

하단 탭에 **홈**을 추가해, 개인 냉장고 기준으로 **유통기한 임박/만료 식재료**와 **만들 수 있는 레시피(만개의레시피 추천)**를 한눈에 보여준다.  
동시에 spacing·typography 등 **최소 디자인 토큰**과 홈용 공통 컴포넌트를 도입해, 이후 전 앱 디자인 고도화(D: 시스템 → 시그니처 → UX)의 출발점으로 삼는다.

## Decisions

| 항목 | 선택 |
|------|------|
| 로드맵 | D: 디자인 시스템 → 시그니처 화면 → UX 폴리싱. **이번 범위는 Phase 1만** |
| 구현 접근 | 홈 먼저 + 토큰 최소 확장 (전면 시스템/홈만 급조는 비추천) |
| 탭 구성 | `홈 / 냉장고 / 장보기 / 가족 / 설정` (5탭) |
| 홈 scope | **항상 개인** (`personal`). ScopeToggle 없음 |
| 임박 식재료 | `status`가 `expired` \| `soon`인 항목, 만료일 가까운 순, **최대 5개** |
| 추천 레시피 | 만개의레시피 `GET /recipes/recommendations?scope=personal`, 점수순 **최대 3개** (부족한 재료 있어도 표시) |
| 레시피 소스 | 만개만. AI 추천·저장 레시피는 홈에 넣지 않음 |
| 스타일 | 기존 clay / emerald `colors` 유지. NativeWind·다크모드 없음 |

## Out of Scope (Phase 1)

- Phase 2: 냉장고·레시피 화면을 새 토큰/EmptyState로 전면 정렬
- Phase 3: 스켈레톤·전 탭 UX 폴리싱
- NativeWind 도입, 다크모드
- 홈용 신규 백엔드 API
- 홈에서 AI 추천 호출
- 홈에 개인/가족 토글 또는 합산 뷰
- 푸시 알림·위젯

## Tab IA

현재 `(tabs)/index`는 냉장고다. Phase 1에서:

| 파일 (목표) | 탭 라벨 | 비고 |
|-------------|---------|------|
| `(tabs)/index.tsx` | 홈 | 신규 대시보드 |
| `(tabs)/fridge.tsx` | 냉장고 | 기존 `index.tsx` 내용 이동 |
| `(tabs)/shopping.tsx` | 장보기 | 유지 |
| `(tabs)/group.tsx` | 가족 | 유지 |
| `(tabs)/settings.tsx` | 설정 | 유지 |

탭 순서: 홈 → 냉장고 → 장보기 → 가족 → 설정.

알림의 `expiry_*` 탭 동작이 `/(main)/(tabs)`(구 냉장고 index)로 가던 경우, **냉장고 탭**(`/(main)/(tabs)/fridge`)으로 맞춘다.

## Home screen

스크롤 대시보드. 데이터는 전부 `scope=personal`.

### 1. 헤더

- 인사 + 닉네임 (`useAuthStore`)
- 알림 벨은 기존처럼 탭 `headerRight` 유지

### 2. 임박 식재료 섹션

- 데이터: `getIngredients('personal')`
- 필터: `status === 'expired' || status === 'soon'`
- 정렬: `expiration_date` 오름차순 (null은 뒤로)
- 표시: 최대 5개 — `ExpiryIngredientRow` (이름, 상태 라벨, 유통기한)
- 행 탭 → `/(main)/edit-ingredient` (기존 냉장고와 동일한 params, `scope=personal`)
- `SectionHeader` 우측/하단 **「냉장고 전체 보기」** → `router.push('/(main)/(tabs)/fridge')` 또는 동등한 탭 이동
- 빈 상태:
  - 냉장고 자체 비어 있음 → 추가 유도 (`EmptyState` + 냉장고/추가 화면)
  - 식재료는 있으나 임박/만료 없음 → “유통기한이 임박한 재료가 없어요”

### 3. 추천 레시피 섹션

- 데이터: `getRecipeRecommendations('personal')`
- `recipes`를 점수(기존 응답 순서/score) 기준으로 상위 3개
- UI: 기존 `RecipeCard` 재사용
- 카드 탭 → 기존 레시피 상세 라우트 (만개: `board_name` / `author_name`)
- **「더 많은 레시피」** → `/(main)/recipes` (기존 목록)
- 빈/에러: 짧은 안내 + 재시도

### 4. 로딩 · 새로고침

- 초기 로딩: 섹션별 또는 화면 공통 `ActivityIndicator` (기존 패턴)
- Pull-to-refresh: ingredients + recommendations 둘 다 refetch
- Query keys: `['ingredients', 'personal']`, `['recipes', 'recommendations', 'personal']` — 기존 키와 맞춰 캐시 공유

## Design tokens & shared components

### Theme (`src/theme/`)

| 파일 | 내용 |
|------|------|
| `colors.ts` | 유지 (필요 시 status soft만 정리) |
| `shadows.ts` | `clayShadow` / `clayShadowSoft` 유지 |
| `spacing.ts` | 신규 — 8 기준 `xs`~`xl` |
| `radius.ts` | 신규 — `sm` / `md` / `lg` / `pill` |
| `typography.ts` | 신규 — `title` / `section` / `body` / `caption` / `label` |

### Components

| 컴포넌트 | 역할 |
|----------|------|
| `SectionHeader` | 섹션 제목 + 선택적 “더보기” 액션 |
| `ExpiryIngredientRow` | 홈용 가벼운 임박 행 (삭제 버튼 없음) |
| `EmptyState` | 아이콘·제목·설명·옵션 CTA |
| `RecipeCard` | 기존 재사용 |

홈 화면은 위 토큰을 우선 적용한다. 다른 탭 전면 교체는 Phase 2.

## Architecture

```
[Tabs]
  index (Home)     ← NEW, personal only
  fridge           ← moved from old index
  shopping / group / settings

[Home]
  useQuery ingredients personal
    → filter expired|soon → top 5 → ExpiryIngredientRow
  useQuery mangae recommendations personal
    → top 3 → RecipeCard
  SectionHeader / EmptyState
  refresh → invalidate both keys

[Navigation]
  expiry row → edit-ingredient (personal)
  recipe card → recipes/detail (mangae params)
  see all fridge → /(tabs)/fridge
  see all recipes → /(main)/recipes
```

## Error handling

- 목록/추천 실패: 섹션 단위 에러 문구 + `다시 시도` (전체 화면 크래시 없음)
- 기존 `getErrorMessage` / `Alert` 패턴은 mutation이 있을 때만 (홈 Phase 1은 주로 조회)

## Success criteria

- 하단 탭에 홈이 첫 번째이고, 냉장고가 두 번째 탭으로 분리됨
- 홈에서 개인 임박/만료 최대 5개, 만개 추천 최대 3개가 보임
- 빈·로딩·에러·당김 새로고침이 동작함
- `spacing` / `radius` / `typography`와 `SectionHeader` · `ExpiryIngredientRow` · `EmptyState`가 추가됨
- 알림의 유통기한 알림 탭이 냉장고 탭으로 올바르게 이동함

## Follow-ups

- **Phase 2**: 냉장고·레시피 목록에 SectionHeader / EmptyState / 토큰 적용
- **Phase 3**: 스켈레톤, 터치 피드백, 빈 상태 카피 폴리싱
