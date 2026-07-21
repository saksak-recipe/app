# RAG 전용 레시피 UI 정리

날짜: 2026-07-22  
상태: Approved (대화에서 섹션별 승인 완료)  
배경: 백엔드에서 생성형 AI 레시피 기능을 제거하고 RAG(만개의레시피 추천)만 유지함

## Goal

프론트에서 생성형 AI 레시피(추천 탭·상세·API·타입)를 제거하고, 추천과 저장을 **별도 Stack 화면**으로 분리해 백엔드 현실과 UI를 맞춘다.

## Decisions

| 항목 | 선택 |
|------|------|
| 범위 | UI + 코드 전면 정리 (`source: 'ai'` 포함) |
| 아키텍처 | 추천 / 저장 화면 분리 (세그먼트 탭 제거) |
| 추천 라벨 | `만개의레시피` |
| 저장 출처 | `'mangae'`만; AI 뱃지·분기 전부 삭제 |
| 홈 | 기존처럼 RAG 추천만; 저장 섹션 추가 없음 |

## Out of Scope

- 백엔드 API/스키마 변경
- 홈에 저장 섹션 추가
- 추천·저장을 하단 탭으로 승격
- 오프라인 캐시·폴더·태그

## Screens & flow

### 라우트

| 라우트 | 역할 | 헤더 |
|--------|------|------|
| `/(main)/recipes` | 만개의레시피 RAG 추천 목록 | `만개의레시피` + 우측 **저장** |
| `/(main)/recipes/saved` | 저장 목록 (신규) | `저장한 레시피` |
| `/(main)/recipes/detail` | 상세 (만개·저장만) | `레시피 상세` |

### 진입

- 홈「더 많은 레시피」·냉장고「레시피 추천」→ `/(main)/recipes`
- 추천 헤더「저장」→ `/(main)/recipes/saved`
- 추천 카드 → detail (`board_name`, `author_name`)
- 저장 카드 → detail (`source=saved`, `saved_id`)

### `recipes/index` (추천만)

- 만개 / AI / 저장 세그먼트 탭 제거
- `ScopeToggle`(가족 있을 때) 유지
- `GET /recipes/recommendations?scope=`
- 빈/에러 문구에서 AI 언급 없음
- 로딩 힌트: 「냉장고 재료로 레시피를 고르는 중…」유지 가능

### `recipes/saved` (신규)

- 기존 저장 탭 FlatList·삭제·빈 상태 이전
- `GET /recipes/saved` · 목록 삭제 `DELETE /recipes/saved/{id}`
- 출처 뱃지 없음 (`AI` / `만개` 제거)
- 빈 상태: 「저장한 레시피가 없어요」 / 「만개의레시피 상세에서 저장하면 여기에서 다시 볼 수 있어요.」

### `recipes/detail`

| 진입 | params | 데이터 |
|------|--------|--------|
| 추천(만개) | `board_name`, `author_name` | `GET /recipes/detail` |
| 저장 목록 | `source=saved`, `saved_id` | `GET /recipes/saved/{id}` |

- `source=ai` / `recipe_id` 분기·쿼리 제거
- 저장 토글: `source: 'mangae'`, `source_id: board_name|author_name`
- 저장 스냅샷 상세 흐름은 기존 유지

## API client & types

### 삭제

`src/api/recipes.ts`

- `getAiRecipeRecommendations`
- `getAiRecipeDetail`
- `AI_REQUEST_TIMEOUT_MS`

`src/types/api.ts`

- `AiRecipeRecommendation`
- `AiRecipeRecommendationResponse`
- `AiRecipeDetail`
- `SavedRecipeSource`에서 `'ai'` 제거 → `'mangae'`만

### 유지

- `GET /recipes/recommendations` · `GET /recipes/detail`
- 저장 CRUD (`/recipes/saved*`)
- Query keys: `['recipes', 'recommendations']`, `['recipes', 'saved']`, status keys

### 컴포넌트

- `SavedRecipeCard`: 출처 뱃지 제거
- `RecipeCard`: 변경 최소 (만개 추천 카드 그대로)

백엔드가 저장 요청에 `source`를 아직 요구하면 프론트는 `'mangae'`만 보낸다. 응답에 `ai`가 와도 UI에 표시하지 않는다(타입상도 허용하지 않음).

## Layout

`src/app/(main)/_layout.tsx`

- `recipes/index` title: `만개의레시피` (헤더 우측「저장」은 화면에서 `headerRight`로 등록)
- `recipes/saved` 등록: title `저장한 레시피`
- `recipes/detail` 유지

## Error handling

- 추천/저장 목록 실패: 기존처럼 인라인 에러 + 「다시 시도」
- 저장/삭제 실패: Alert
- 상세 404: 기존 `DetailError` 재사용

## Success criteria

1. AI 탭·AI API 호출·`source=ai` 진입점이 없다
2. 추천 ↔ 저장이 별도 화면으로 오가며 동작한다
3. 만개 상세 저장/해제·저장 목록 삭제가 정상이다
4. `src/`에 AI 레시피 관련 심볼·타입이 없다

## Relation to prior specs

- `2026-07-21-saved-recipe-frontend-design.md`의 「만개 / AI / 저장」탭 구조는 이 스펙으로 대체한다 (저장 기능 자체는 유지, 진입만 분리).
- `2026-07-21-home-tab-design.md`의 「홈은 만개만」결정은 그대로 유지한다.
