# 일일 한도 남은 횟수 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레시피 추천·영수증 스캔 화면 상단에 오늘 남은 사용 횟수를 표시하고, 차감 없는 `GET /quotas`로 진입 직후부터 정확한 값을 보여 준다.

**Architecture:** 백엔드 `DailyQuotaStore.peek` + `GET /api/v1/quotas`로 OCR/RAG 한도를 조회한다. 앱은 TanStack Query로 quotas를 가져와 `QuotaBanner`에 넘기고, 추천/OCR 성공·429 시 캐시를 갱신한다.

**Tech Stack:** FastAPI, Redis(`DailyQuotaStore`), pytest / Expo 57, TanStack Query, Axios, TypeScript

**Spec:** `docs/superpowers/specs/2026-07-28-quota-remaining-ui-design.md`  
**관련 백엔드 스펙:** `../back/docs/superpowers/specs/2026-07-28-auth-ai-rate-limits-design.md`

## Global Constraints

- 표시 위치: `recipes/index.tsx`(rag) + `add.tsx`(ocr)만. 홈 탭 제외
- 조회 API: `GET /api/v1/quotas` → `{ ocr: QuotaInfo, rag: QuotaInfo }` (consume 없음)
- 한도: OCR 3 / RAG 7 (기존 `OCR_DAILY_LIMIT` / `RAG_DAILY_LIMIT`)
- 문구: `오늘 추천 N회 남음` / `오늘 스캔 N회 남음` / 0이면 `오늘 횟수를 모두 사용했어요`
- quotas 로딩·실패 시 배너 숨김. 본 기능은 블로킹하지 않음
- 기존 OCR/RAG 성공 `quota`·429 코드 계약 유지
- 앱 검증: `npx tsc --noEmit` (Jest 없음). 백엔드: pytest

## File Structure

| File | Responsibility |
|------|----------------|
| `back/src/core/quota.py` | `DailyQuotaStore.peek` |
| `back/src/domains/quota/schemas.py` | `QuotasResponse` |
| `back/src/api/v1/endpoints/quota.py` | `GET /quotas` |
| `back/src/api/api.py` | router 등록 |
| `back/tests/unit/test_daily_quota_store.py` | peek 단위 테스트 |
| `back/tests/api/test_quota_api.py` | GET /quotas API 테스트 |
| `app/src/types/api.ts` | `QuotaInfo`, `QuotasResponse`, 응답 `quota` 필드 |
| `app/src/api/quotas.ts` | `getQuotas` |
| `app/src/api/queryKeys.ts` | `queryKeys.quotas` |
| `app/src/lib/quota.ts` | 배너 문구 + 429 시 캐시 패치 헬퍼 |
| `app/src/components/QuotaBanner.tsx` | 상단 한 줄 배너 |
| `app/src/app/(main)/recipes/index.tsx` | rag 배너 + refresh |
| `app/src/hooks/useReceiptOcr.ts` | OCR 성공/429 시 quotas 갱신 |
| `app/src/app/(main)/add.tsx` | ocr 배너 |

---

### Task 1: Backend — `DailyQuotaStore.peek`

**Files:**
- Modify: `/Users/jeong-yeonghun/Desktop/saksak/back/src/core/quota.py`
- Modify: `/Users/jeong-yeonghun/Desktop/saksak/back/tests/unit/test_daily_quota_store.py`

**Interfaces:**
- Produces: `async def peek(self, kind: str, subject: str, limit: int) -> QuotaInfo`
- Consumes: 기존 `_key`, `_snapshot`, Redis GET

- [ ] **Step 1: Write failing peek tests**

Append to `tests/unit/test_daily_quota_store.py`:

```python
from core.quota import KIND_OCR, KIND_RAG, OCR_DAILY_LIMIT, RAG_DAILY_LIMIT


async def test_peek_missing_key_returns_zero_used(store: DailyQuotaStore):
    q = await store.peek(KIND_OCR, "user-1", OCR_DAILY_LIMIT)
    assert q.limit == 3
    assert q.used == 0
    assert q.remaining == 3
    assert q.reset_at.tzinfo is not None


async def test_peek_does_not_increment(store: DailyQuotaStore):
    await store.peek(KIND_RAG, "user-1", RAG_DAILY_LIMIT)
    q = await store.peek(KIND_RAG, "user-1", RAG_DAILY_LIMIT)
    assert q.used == 0
    assert q.remaining == 7


async def test_peek_matches_consume_used(store: DailyQuotaStore):
    await store.consume(KIND_OCR, "user-1", OCR_DAILY_LIMIT)
    await store.consume(KIND_OCR, "user-1", OCR_DAILY_LIMIT)
    q = await store.peek(KIND_OCR, "user-1", OCR_DAILY_LIMIT)
    assert q.used == 2
    assert q.remaining == 1
```

- [ ] **Step 2: Run tests — expect fail**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back && python -m pytest tests/unit/test_daily_quota_store.py::test_peek_missing_key_returns_zero_used -v
```

Expected: FAIL (`peek` AttributeError 또는 import/호출 실패)

- [ ] **Step 3: Implement `peek`**

In `src/core/quota.py`, add to `DailyQuotaStore`:

```python
async def peek(self, kind: str, subject: str, limit: int) -> QuotaInfo:
    key = self._key(kind, subject)
    raw = await self._redis.get(key)
    used = int(raw) if raw is not None else 0
    return self._snapshot(used, limit)
```

- [ ] **Step 4: Run peek tests — expect pass**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back && python -m pytest tests/unit/test_daily_quota_store.py -v
```

Expected: PASS (기존 consume 테스트 + peek 3개)

- [ ] **Step 5: Commit (back repo)**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back
git add src/core/quota.py tests/unit/test_daily_quota_store.py
git commit -m "$(cat <<'EOF'
Feat: DailyQuotaStore.peek로 일일 한도 조회 추가

EOF
)"
```

---

### Task 2: Backend — `GET /api/v1/quotas`

**Files:**
- Create: `/Users/jeong-yeonghun/Desktop/saksak/back/src/domains/quota/schemas.py`
- Create: `/Users/jeong-yeonghun/Desktop/saksak/back/src/domains/quota/__init__.py` (empty ok)
- Create: `/Users/jeong-yeonghun/Desktop/saksak/back/src/api/v1/endpoints/quota.py`
- Modify: `/Users/jeong-yeonghun/Desktop/saksak/back/src/api/api.py`
- Create: `/Users/jeong-yeonghun/Desktop/saksak/back/tests/api/test_quota_api.py`

**Interfaces:**
- Consumes: `get_daily_quota_store`, `get_current_user` (deps에서 기존 패턴)
- Produces: `QuotasResponse { ocr: QuotaInfo, rag: QuotaInfo }`

- [ ] **Step 1: Check how other endpoints get current user**

Confirm in `api/deps.py` / `endpoints/notification.py` the auth dependency name (likely `get_current_user` returning `User`). Use the same pattern in the new endpoint.

- [ ] **Step 2: Write failing API tests**

Create `tests/api/test_quota_api.py`:

```python
from httpx import AsyncClient

from core.exception.codes import ErrorCode
from core.quota import (
    DailyQuotaStore,
    KIND_OCR,
    OCR_DAILY_LIMIT,
)
from api.deps import get_daily_quota_store
from main import app


async def test_quotas_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/quotas")
    assert response.status_code == 401
    assert response.json()["code"] == ErrorCode.UNAUTHORIZED


async def test_quotas_returns_defaults(
    client: AsyncClient, auth_headers: dict[str, str]
):
    response = await client.get("/api/v1/quotas", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["ocr"]["limit"] == 3
    assert body["ocr"]["used"] == 0
    assert body["ocr"]["remaining"] == 3
    assert body["rag"]["limit"] == 7
    assert body["rag"]["used"] == 0
    assert body["rag"]["remaining"] == 7
    assert "reset_at" in body["ocr"]
    assert "reset_at" in body["rag"]


async def test_quotas_reflects_consumed_ocr(
    client: AsyncClient,
    auth_headers: dict[str, str],
    test_user,
):
    store = get_daily_quota_store()
    await store.consume(KIND_OCR, str(test_user.id), OCR_DAILY_LIMIT)

    response = await client.get("/api/v1/quotas", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["ocr"]["used"] == 1
    assert body["ocr"]["remaining"] == 2
    assert body["rag"]["used"] == 0
```

If `get_daily_quota_store()` without request context fails (needs Redis from app), use the same Redis fixture pattern as other API tests that touch Redis — inspect `tests/conftest.py` / existing quota-consuming API tests and mirror that. Prefer calling the live store via app Redis rather than mocking the whole endpoint.

- [ ] **Step 3: Run API test — expect fail**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back && python -m pytest tests/api/test_quota_api.py::test_quotas_requires_auth -v
```

Expected: FAIL (404 route missing)

- [ ] **Step 4: Add schema + endpoint + router**

`src/domains/quota/schemas.py`:

```python
from pydantic import BaseModel

from core.quota import QuotaInfo


class QuotasResponse(BaseModel):
    ocr: QuotaInfo
    rag: QuotaInfo
```

`src/api/v1/endpoints/quota.py` (adjust `get_current_user` import to match codebase):

```python
from fastapi import APIRouter, Depends

from api.deps import get_current_user, get_daily_quota_store
from core.quota import (
    DailyQuotaStore,
    KIND_OCR,
    KIND_RAG,
    OCR_DAILY_LIMIT,
    RAG_DAILY_LIMIT,
)
from domains.quota.schemas import QuotasResponse
from domains.user.model import User

router = APIRouter(prefix="/quotas", tags=["quotas"])


@router.get("", response_model=QuotasResponse)
async def get_quotas(
    user: User = Depends(get_current_user),
    store: DailyQuotaStore = Depends(get_daily_quota_store),
) -> QuotasResponse:
    subject = str(user.id)
    ocr = await store.peek(KIND_OCR, subject, OCR_DAILY_LIMIT)
    rag = await store.peek(KIND_RAG, subject, RAG_DAILY_LIMIT)
    return QuotasResponse(ocr=ocr, rag=rag)
```

In `src/api/api.py`:

```python
from api.v1.endpoints.quota import router as quota_router
# ...
api_router.include_router(quota_router)
```

- [ ] **Step 5: Run API tests — expect pass**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back && python -m pytest tests/api/test_quota_api.py tests/unit/test_daily_quota_store.py -v
```

Expected: PASS

- [ ] **Step 6: Commit (back repo)**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/back
git add src/domains/quota src/api/v1/endpoints/quota.py src/api/api.py tests/api/test_quota_api.py
git commit -m "$(cat <<'EOF'
Feat: GET /quotas로 OCR·RAG 일일 한도 조회 API 추가

EOF
)"
```

---

### Task 3: App — types, API, query key, helpers

**Files:**
- Modify: `src/types/api.ts`
- Create: `src/api/quotas.ts`
- Modify: `src/api/queryKeys.ts`
- Create: `src/lib/quota.ts`

**Interfaces:**
- Produces:
  - `QuotaInfo = { limit: number; used: number; remaining: number; reset_at: string }`
  - `QuotasResponse = { ocr: QuotaInfo; rag: QuotaInfo }`
  - `getQuotas(): Promise<QuotasResponse>`
  - `queryKeys.quotas = ['quotas'] as const`
  - `formatQuotaBannerText(kind: 'ocr' | 'rag', remaining: number): string`
  - `getApiErrorCode(error: unknown): string | null`
  - `patchQuotasCache(queryClient, kind, quota | null): void` — `quota` 있으면 해당 필드 set; 429용으로 remaining 0 스냅샷도 지원

- [ ] **Step 1: Extend types**

In `src/types/api.ts`, add:

```typescript
export type QuotaInfo = {
  limit: number;
  used: number;
  remaining: number;
  reset_at: string;
};

export type QuotasResponse = {
  ocr: QuotaInfo;
  rag: QuotaInfo;
};
```

Update:

```typescript
export type RecipeRecommendationResponse = {
  ingredients_used: string[];
  recipes: RecipeRecommendation[];
  quota?: QuotaInfo | null;
};

export type OcrReceiptResponse = {
  ingredients: string[];
  quota: QuotaInfo;
};
```

Optionally extend `ApiErrorBody` with optional `limit?`, `remaining?`, `reset_at?` (429 extra merge).

- [ ] **Step 2: API + query key**

`src/api/quotas.ts`:

```typescript
import { apiClient } from '@/api/client';
import type { QuotasResponse } from '@/types/api';

export async function getQuotas(): Promise<QuotasResponse> {
  const { data } = await apiClient.get<QuotasResponse>('/quotas');
  return data;
}
```

In `queryKeys.ts`:

```typescript
quotas: ['quotas'] as const,
```

(at top level of `queryKeys`, sibling of `users`)

- [ ] **Step 3: Helpers**

`src/lib/quota.ts`:

```typescript
import type { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { queryKeys } from '@/api/queryKeys';
import type { ApiErrorBody, QuotaInfo, QuotasResponse } from '@/types/api';

export type QuotaKind = 'ocr' | 'rag';

export function formatQuotaBannerText(
  kind: QuotaKind,
  remaining: number,
): string {
  if (remaining <= 0) {
    return '오늘 횟수를 모두 사용했어요';
  }
  if (kind === 'rag') {
    return `오늘 추천 ${remaining}회 남음`;
  }
  return `오늘 스캔 ${remaining}회 남음`;
}

export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return null;
  }
  const code = error.response?.data?.code;
  return typeof code === 'string' ? code : null;
}

export function patchQuotasKind(
  queryClient: QueryClient,
  kind: QuotaKind,
  quota: QuotaInfo,
): void {
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, (prev) => {
    if (!prev) {
      // keep single-kind update only when cache exists; otherwise invalidate
      return prev;
    }
    return { ...prev, [kind]: quota };
  });
  if (!queryClient.getQueryData(queryKeys.quotas)) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
  }
}

export function markQuotaExhausted(
  queryClient: QueryClient,
  kind: QuotaKind,
): void {
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, (prev) => {
    if (!prev) {
      return prev;
    }
    const current = prev[kind];
    return {
      ...prev,
      [kind]: {
        ...current,
        used: current.limit,
        remaining: 0,
      },
    };
  });
  if (!queryClient.getQueryData(queryKeys.quotas)) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
  }
}
```

Fix logic so we don't double-check awkwardly — final helper should be:

```typescript
export function patchQuotasKind(
  queryClient: QueryClient,
  kind: QuotaKind,
  quota: QuotaInfo,
): void {
  const prev = queryClient.getQueryData<QuotasResponse>(queryKeys.quotas);
  if (!prev) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
    return;
  }
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, {
    ...prev,
    [kind]: quota,
  });
}

export function markQuotaExhausted(
  queryClient: QueryClient,
  kind: QuotaKind,
): void {
  const prev = queryClient.getQueryData<QuotasResponse>(queryKeys.quotas);
  if (!prev) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotas });
    return;
  }
  const current = prev[kind];
  queryClient.setQueryData<QuotasResponse>(queryKeys.quotas, {
    ...prev,
    [kind]: { ...current, used: current.limit, remaining: 0 },
  });
}
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app && npx tsc --noEmit
```

Expected: PASS (또는 기존 무관 에러만)

- [ ] **Step 5: Commit (app repo)**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app
git add src/types/api.ts src/api/quotas.ts src/api/queryKeys.ts src/lib/quota.ts
git commit -m "$(cat <<'EOF'
Feat: quotas API 타입·클라이언트·캐시 헬퍼 추가

EOF
)"
```

---

### Task 4: App — `QuotaBanner` + 레시피 추천 화면

**Files:**
- Create: `src/components/QuotaBanner.tsx`
- Modify: `src/app/(main)/recipes/index.tsx`

**Interfaces:**
- Consumes: `getQuotas`, `queryKeys.quotas`, `formatQuotaBannerText`, `patchQuotasKind`, `markQuotaExhausted`, `getApiErrorCode`
- Produces: `<QuotaBanner kind="rag" quota={...} />`

- [ ] **Step 1: Create `QuotaBanner`**

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { formatQuotaBannerText, type QuotaKind } from '@/lib/quota';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import type { QuotaInfo } from '@/types/api';

type QuotaBannerProps = {
  kind: QuotaKind;
  quota: QuotaInfo | null | undefined;
};

export function QuotaBanner({ kind, quota }: QuotaBannerProps) {
  if (!quota) {
    return null;
  }

  const exhausted = quota.remaining <= 0;

  return (
    <View style={[styles.wrap, exhausted && styles.wrapExhausted]}>
      <Text style={[styles.text, exhausted && styles.textExhausted]}>
        {formatQuotaBannerText(kind, quota.remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  wrapExhausted: {
    backgroundColor: colors.dangerSoft,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  textExhausted: {
    color: colors.danger,
  },
});
```

- [ ] **Step 2: Wire `recipes/index.tsx`**

- `useQuery` for quotas: `queryKey: queryKeys.quotas`, `queryFn: getQuotas`
- Render `<QuotaBanner kind="rag" quota={quotasQuery.data?.rag} />` after ScopeToggle block (always in tree when not loading quotas — component returns null if missing)
- On recommendations `query` success path: if `query.data?.quota` then `patchQuotasKind(queryClient, 'rag', query.data.quota)` — use `useEffect` on `query.data` or handle in `queryFn` wrapper:

```typescript
const queryClient = useQueryClient();

const query = useQuery({
  queryKey: queryKeys.recipes.recommendations(scope),
  queryFn: async () => {
    const data = await getRecipeRecommendations(scope);
    if (data.quota) {
      patchQuotasKind(queryClient, 'rag', data.quota);
    }
    return data;
  },
});

const quotasQuery = useQuery({
  queryKey: queryKeys.quotas,
  queryFn: getQuotas,
});
```

- Pull-to-refresh:

```typescript
onRefresh={() => {
  void Promise.all([query.refetch(), quotasQuery.refetch()]);
}}
refreshing={query.isRefetching || quotasQuery.isRefetching}
```

- On recommendations error, if `getApiErrorCode(error) === 'RAG_DAILY_LIMIT_EXCEEDED'`, call `markQuotaExhausted(queryClient, 'rag')` (in `useEffect` watching `query.error` or inside queryFn catch rethrow after mark).

Example in queryFn:

```typescript
queryFn: async () => {
  try {
    const data = await getRecipeRecommendations(scope);
    if (data.quota) {
      patchQuotasKind(queryClient, 'rag', data.quota);
    }
    return data;
  } catch (error) {
    if (getApiErrorCode(error) === 'RAG_DAILY_LIMIT_EXCEEDED') {
      markQuotaExhausted(queryClient, 'rag');
    }
    throw error;
  }
},
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app && npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app
git add src/components/QuotaBanner.tsx src/app/(main)/recipes/index.tsx
git commit -m "$(cat <<'EOF'
Feat: 레시피 추천 화면에 남은 추천 횟수 배너 표시

EOF
)"
```

---

### Task 5: App — OCR 배너 (`add.tsx` + `useReceiptOcr`)

**Files:**
- Modify: `src/hooks/useReceiptOcr.ts`
- Modify: `src/app/(main)/add.tsx`

**Interfaces:**
- Consumes: `getQuotas`, `QuotaBanner`, `patchQuotasKind`, `markQuotaExhausted`, `getApiErrorCode`
- Produces: OCR 성공 시 `ocr` 캐시 갱신, 429 시 exhausted

- [ ] **Step 1: Update `useReceiptOcr` mutation callbacks**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
// ...
import {
  getApiErrorCode,
  markQuotaExhausted,
  patchQuotasKind,
} from '@/lib/quota';

// inside hook:
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (asset: PickedAsset) =>
    parseReceiptImage(asset.uri, { /* existing */ }),
  onSuccess: (data) => {
    patchQuotasKind(queryClient, 'ocr', data.quota);
    // existing empty / merge logic unchanged
  },
  onError: (err) => {
    if (getApiErrorCode(err) === 'OCR_DAILY_LIMIT_EXCEEDED') {
      markQuotaExhausted(queryClient, 'ocr');
    }
    // existing error message logic
  },
});
```

Note: empty ingredients still includes `quota` from server — always patch on success.

- [ ] **Step 2: Wire banner in `add.tsx`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getQuotas } from '@/api/quotas';
import { queryKeys } from '@/api/queryKeys';
import { QuotaBanner } from '@/components/QuotaBanner';

const quotasQuery = useQuery({
  queryKey: queryKeys.quotas,
  queryFn: getQuotas,
});
```

Inside ScrollView card, above the hint or above 「영수증 스캔」:

```tsx
<QuotaBanner kind="ocr" quota={quotasQuery.data?.ocr} />
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app && npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 4: Manual smoke (optional)**

1. 백엔드 실행 후 앱에서 레시피 추천 진입 → `오늘 추천 7회 남음` (또는 잔여)
2. 추천 새로고침 후 횟수 감소 반영
3. 식재료 추가 → `오늘 스캔 3회 남음`
4. OCR 성공/한도 초과 시 배너 갱신

- [ ] **Step 5: Commit**

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app
git add src/hooks/useReceiptOcr.ts src/app/(main)/add.tsx
git commit -m "$(cat <<'EOF'
Feat: 식재료 추가 화면에 OCR 남은 횟수 배너 표시

EOF
)"
```

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| `DailyQuotaStore.peek` | Task 1 |
| `GET /quotas` `{ocr,rag}` | Task 2 |
| Types + `getQuotas` + queryKey | Task 3 |
| Banner copy / exhausted style | Task 4 (`QuotaBanner` + `formatQuotaBannerText`) |
| `recipes/index` rag banner + refresh | Task 4 |
| Success/429 cache update (rag) | Task 4 |
| `add.tsx` ocr banner | Task 5 |
| OCR success/429 cache update | Task 5 |
| Home / email_send out of scope | — |

## Placeholder / consistency notes

- Task 2의 `get_current_user` / `User`는 `api.deps` · `domains.user.model` 경로를 사용.
- `patchQuotasKind` / `markQuotaExhausted` 최종 구현은 Task 3의 두 번째(명확한) 버전을 사용.
