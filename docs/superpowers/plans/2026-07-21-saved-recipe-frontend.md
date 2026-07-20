# Saved Recipe Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 AI·만개 레시피 저장/해제, 저장 탭 목록·스냅샷 상세·삭제를 제공한다.

**Architecture:** `recipes/index`에 저장 탭 추가, `recipes/detail`에 saved 분기·저장 토글. API/타입은 기존 `api/recipes`·`types/api` 확장. TanStack Query invalidate.

**Tech Stack:** Expo Router, TanStack Query, TypeScript, Native StyleSheet, 기존 clay UI 컬러

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-saved-recipe-frontend-design.md`
- 낙관적 업데이트 없음; invalidate만
- 스와이프 패키지·Zustand·새 Stack 화면 파일 없음
- 만개 source_id = `board_name|author_name`

## File map

| File | Role |
|------|------|
| `src/types/api.ts` | Saved* 타입 |
| `src/api/recipes.ts` | saved API 함수 |
| `src/components/SavedRecipeCard.tsx` | 저장 탭 카드 + 삭제 |
| `src/app/(main)/recipes/index.tsx` | 세 번째 탭 |
| `src/app/(main)/recipes/detail.tsx` | saved 상세 + 저장 토글 |

---

### Task 1: Types + API

- [x] Add SavedRecipeListItem, SavedRecipeDetail, SavedRecipeStatus, SaveRecipeRequest
- [x] Add list/get/status/save/delete in `api/recipes.ts`
- [x] `npx tsc --noEmit` clean for these

### Task 2: SavedRecipeCard + index saved tab

- [x] Create SavedRecipeCard (name, source badge, difficulty/time, delete button)
- [x] Extend index: tab `'saved'`, query list, navigate with `source=saved&saved_id`

### Task 3: Detail save toggle + saved snapshot

- [x] saved params → getSavedRecipe; map snapshot to UI
- [x] status query + save/delete mutations + invalidate
- [x] Title row save button
- [x] `tsc --noEmit` PASS

### Task 4: Verification

- [x] tsc clean; manual checklist against success criteria
