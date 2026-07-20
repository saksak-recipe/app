# 저장된 레시피 프론트엔드

날짜: 2026-07-21  
상태: Approved (대화에서 섹션별 승인 완료)  
백엔드 스펙: `back/docs/superpowers/specs/2026-07-21-saved-recipe-design.md`

## Goal

앱에서 AI·만개 레시피를 저장·해제하고, 「저장」 탭에서 목록을 꺼내 스냅샷 상세를 보며, 목록에서도 삭제할 수 있게 한다.

## Decisions

| 항목 | 선택 |
|------|------|
| 범위 | 상세 저장/해제 + 저장 목록 + 목록 삭제 (옵션 B) |
| 목록 진입 | 레시피 추천 화면 **세 번째 탭** (만개 / AI / 저장) |
| 해제 | 상세 토글 + 저장 탭 삭제 버튼 |
| 아키텍처 | 기존 `recipes/index`·`detail` 확장 (전용 화면 분리·Zustand 찜 스토어 없음) |
| 서버 상태 | TanStack Query + invalidate (낙관적 업데이트 없음) |
| 목록 삭제 UI | 행 오른쪽 삭제 아이콘 (스와이프 패키지 없음) |

## Out of Scope

- 폴더·메모·태그·공유
- 오프라인 캐시
- 스와이프 제스처 라이브러리
- 백엔드 API/스키마 변경
- 저장본과 원본 재동기화

## Screens & flow

### `recipes/index` — 탭

탭: `만개의 레시피` | `AI 레시피` | `저장`

- 만개/AI: 기존 추천 흐름 유지
- 저장: `GET /api/v1/recipes/saved`
  - 카드: 이름, 출처 뱃지(ai|mangae), 난이도/시간(있으면)
  - 탭 → 상세 (`source=saved`, `saved_id`)
  - 삭제 아이콘 → `DELETE /recipes/saved/{id}` 후 목록 갱신
  - 빈 목록: “저장한 레시피가 없어요”

저장 탭 카드는 owned/missing이 없으므로 기존 `RecipeCard`를 그대로 쓰지 않고,  
`variant="saved"` 또는 별도 `SavedRecipeCard`로 가벼운 카드를 둔다.

### `recipes/detail` — 진입

| 진입 | params | 데이터 |
|------|--------|--------|
| 추천(만개) | `board_name`, `author_name` (source 생략 또는 mangae) | 원본 `GET /recipes/detail` |
| 추천(AI) | `source=ai`, `recipe_id` | 원본 `GET /recipes/ai/detail` |
| 저장 탭 | `source=saved`, `saved_id` | 스냅샷 `GET /recipes/saved/{id}` |

### 저장 토글 (원본·스냅샷 상세 공통)

- `GET /recipes/saved/status?source=&source_id=` 로 초기 상태
  - AI: `source_id = recipe_id`
  - 만개: `source_id = board_name|author_name`
  - 저장 탭 진입: 이미 저장본이므로 UI는 저장됨; `id = saved_id`
- 미저장 → `POST /recipes/saved` → status·목록 invalidate
- 저장됨 → `DELETE /recipes/saved/{id}` → status·목록·해당 상세 invalidate
- 확인 다이얼로그 없음
- pending 중 버튼 비활성
- 409(이미 저장) → status refetch 후 저장됨 UI

버튼 위치: 상세 본문 상단(제목 근처). 미저장 outline 「저장」 / 저장됨 filled 「저장됨」.

## API client & Query

**타입** (`src/types/api.ts`)

- `SavedRecipeListItem`
- `SavedRecipeDetail`
- `SavedRecipeStatus`
- `SaveRecipeRequest`

**함수** (`src/api/recipes.ts` 또는 `src/api/savedRecipes.ts`)

- `listSavedRecipes`
- `getSavedRecipe(id)`
- `getSavedRecipeStatus(source, sourceId)`
- `saveRecipe({ source, source_id })`
- `deleteSavedRecipe(id)`

**Query keys**

- `['recipes', 'saved']`
- `['recipes', 'saved', id]`
- `['recipes', 'saved', 'status', source, sourceId]`

**Mutation 패턴**  
기존 `add.tsx` / 냉장고 화면처럼 화면 내 `useMutation` + `queryClient.invalidateQueries`.  
별도 hooks 폴더·전역 스토어 없음.

## Error handling

- 저장/삭제 실패: Alert 또는 인라인 짧은 문구 (앱 기존 톤)
- 원본 상세 404: 저장 불가(버튼 비활성 또는 안내)
- 저장 스냅샷 404: 기존 상세 404 UI 재사용

## Success criteria

1. 만개·AI 상세에서 저장·해제 가능
2. 저장 탭에서 목록·스냅샷 상세·삭제 가능
3. 저장/삭제 후 탭 목록과 status UI가 일치
4. 기존 만개/AI 추천·상세 회귀 없음

## Layout registration

`src/app/(main)/_layout.tsx` — 필요 시 saved 관련 옵션만; 새 Stack 화면 파일은 만들지 않고 index/detail 확장.
