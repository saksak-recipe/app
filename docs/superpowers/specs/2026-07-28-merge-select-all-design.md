# 가족으로 보내기 — 섹션별 전체 선택/해제

날짜: 2026-07-28  
상태: Approved (대화에서 섹션별 승인 완료)  
범위: `app` 프론트만 (`merge.tsx`)  
백엔드: 변경 없음 (`POST /groups/me/merge` 기존 ID 목록 유지)

## Goal

가족으로 보내기 화면에서 식재료·장보기 각각 한 번에 전체 선택하거나 해제할 수 있게 한다.

## Decisions

| 항목 | 선택 |
|------|------|
| 적용 범위 | 식재료 + 장보기 **각각** 섹션 |
| UI | 섹션 헤더 토글 — 전부 선택이면 `전체 해제`, 아니면 `전체 선택` |
| 구현 | 프론트만 (선택 ID를 기존 merge API로 전송) |
| 빈 목록 | 해당 섹션 항목 0개면 토글 숨김 |

## Out of Scope

- 백엔드 merge API / 스키마 변경 (`ingredients_all` 플래그 등)
- 식재료·장보기 한 번에 묶는 전역 전체 선택
- 복사/이동 방식·보내기 버튼 동작 변경
- 마스터 체크박스 indeterminate 상태

## UI / Behavior

대상 파일: `src/app/(main)/merge.tsx`

### 섹션 헤더

```
[식재료]                    [전체 선택]
항목 체크 리스트...

[장보기]                    [전체 해제]  ← 전부 선택된 경우
항목 체크 리스트...
```

- 왼쪽: 기존 섹션 제목
- 오른쪽: Pressable 텍스트 버튼
- 라벨 규칙:
  - 해당 섹션의 모든 id가 selected에 포함 → `전체 해제`
  - 그 외 (0개 또는 부분 선택) → `전체 선택`
- 항목 0개 → 토글 버튼 숨김 (제목만 표시, 기존 empty 문구 유지)

### 동작

| 액션 | 결과 |
|------|------|
| 전체 선택 탭 | 해당 섹션 모든 항목 id를 selected에 설정 |
| 전체 해제 탭 | 해당 섹션 selected를 `[]`로 비움 |
| 개별 체크 | 기존 `toggleIngredient` / `toggleShopping` 유지 |
| 보내기 | 기존과 동일: `selectedIngredients`, `selectedShopping`를 merge API에 전달 |

부분 선택 상태에서 `전체 선택`을 누르면 나머지까지 포함해 **전부** 선택한다.

## Data Flow

```
ingredientsQuery / shoppingQuery
  → 목록 렌더 + 섹션별 allSelected 여부 계산
  → 토글 탭 시 setSelectedIngredients / setSelectedShopping
  → 보내기 시 mergePersonalIntoGroup({ mode, ingredients, shopping_items })
  → 백엔드 변경 없음
```

## Testing

수동 확인:

1. 식재료만 있을 때 전체 선택 → 보내기 가능, 장보기 토글 없음
2. 둘 다 있을 때 각 섹션 독립적으로 전체 선택/해제
3. 부분 선택 후 전체 선택 → 전부 체크
4. 전부 선택 후 하나 해제 → 라벨이 `전체 선택`으로 바뀜
5. 복사/이동·보내기 결과가 기존과 동일
