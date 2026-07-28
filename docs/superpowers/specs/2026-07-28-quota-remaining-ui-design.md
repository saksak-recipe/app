# 일일 사용 한도 남은 횟수 UI (추천 · OCR)

날짜: 2026-07-28  
상태: Approved (대화에서 섹션별 승인 완료)  
관련 백엔드: `back` 일일 쿼터 (`2026-07-28-auth-ai-rate-limits-design.md`)  
범위: `back` peek API + `app` 상단 표시

## Goal

레시피 추천 화면과 식재료 추가(영수증 스캔) 화면 상단에  
오늘 남은 사용 횟수를 보여 준다. 화면 진입 직후부터 정확한 값을 위해  
차감 없는 조회 API를 추가한다.

## Decisions

| 항목 | 선택 |
|------|------|
| 표시 위치 | **A.** 레시피 추천 화면 + 식재료 추가(OCR) 화면만 (홈 제외) |
| 데이터 소스 | **C.** `GET /quotas` peek API (진입 시 조회) |
| API 형태 | **1.** 묶음 조회 `{ ocr, rag }` |
| 문구 | 추천 `오늘 추천 N회 남음` / OCR `오늘 스캔 N회 남음` / 0이면 `오늘 횟수를 모두 사용했어요` |
| UI | 카드 없는 한 줄 배너 (soft 배경 가능) |

## Out of Scope

- 홈 탭·냉장고 탭 남은 횟수 표시
- 메일 발송(`email_send`) quota UI
- 로그인 잠금 UI (별도)
- 결제·플랜·한도 상향
- 추천 조회 자체가 횟수를 소모하는 정책 변경 (기존 consume 유지)

## Architecture

```
[백엔드]
GET /api/v1/quotas (auth)
  → DailyQuotaStore.peek(ocr|rag, user_id, limit)
  → { ocr: QuotaInfo, rag: QuotaInfo }
  ※ incr 없음. 키 없으면 used=0

기존 POST /ocr/receipt, GET /recipes/recommendations
  → 성공 시 response.quota 유지
  → 429 시 OCR_DAILY_LIMIT_EXCEEDED / RAG_DAILY_LIMIT_EXCEEDED + remaining 0

[앱]
recipes/index.tsx  → useQuery quotas → rag 배너
add.tsx            → useQuery quotas → ocr 배너
추천/OCR 성공·429 시 quotas 캐시 갱신(또는 invalidate)
```

## Backend

### `DailyQuotaStore.peek`

```python
async def peek(self, kind: str, subject: str, limit: int) -> QuotaInfo:
    # GET redis key; missing → used=0
    # return same QuotaInfo shape as consume (limit/used/remaining/reset_at)
```

### `GET /api/v1/quotas`

- 인증 필수 (`current_user`)
- 응답:

```json
{
  "ocr": {
    "limit": 3,
    "used": 1,
    "remaining": 2,
    "reset_at": "2026-07-29T00:00:00+09:00"
  },
  "rag": {
    "limit": 7,
    "used": 0,
    "remaining": 7,
    "reset_at": "2026-07-29T00:00:00+09:00"
  }
}
```

- 한도 상수: 기존 `OCR_DAILY_LIMIT=3`, `RAG_DAILY_LIMIT=7` 재사용
- `reset_at`: KST 다음 날 00:00 (기존과 동일)

### 기존 계약 (변경 없음)

- OCR/RAG 성공 응답의 `quota` 필드
- 429 에러 코드 및 `extra.limit|remaining|reset_at`

## Frontend

### Types (`src/types/api.ts`)

```ts
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

`RecipeRecommendationResponse.quota`, `OcrReceiptResponse.quota`에 `QuotaInfo` 반영.

### API / Query

| 구성 | 역할 |
|------|------|
| `src/api/quotas.ts` | `getQuotas(): Promise<QuotasResponse>` |
| `queryKeys.quotas` | `['quotas']` |
| (선택) `QuotaBanner` | `kind: 'ocr' \| 'rag'`, `quota?: QuotaInfo \| null`, `loading?` |

### Screens

| 화면 | 표시 |
|------|------|
| `recipes/index.tsx` | ScopeToggle 아래(없으면 목록 위). `rag` |
| `add.tsx` | 「영수증 스캔」 근처 상단. `ocr` |

### Copy

| 상태 | 문구 |
|------|------|
| `remaining > 0` | 추천: `오늘 추천 {n}회 남음` / OCR: `오늘 스캔 {n}회 남음` |
| `remaining === 0` | `오늘 횟수를 모두 사용했어요` (muted 또는 danger soft) |
| quotas 로딩 | 배너 숨김 (데이터 오면 표시) |
| quotas 조회 실패 | 배너 숨김. 추천/스캔 본 기능은 그대로 |

### Refresh

1. 화면 마운트 시 `getQuotas`
2. 추천 목록 성공 후 `data.quota`가 있으면 quotas 캐시의 `rag` 갱신 (또는 invalidate)
3. OCR 성공 후 `data.quota`로 `ocr` 갱신 (또는 invalidate)
4. 429 (`RAG_DAILY_LIMIT_EXCEEDED` / `OCR_DAILY_LIMIT_EXCEEDED`) → 해당 kind remaining 0 반영 + 기존 에러 메시지
5. 추천 화면 pull-to-refresh → recommendations + quotas 동시 refetch

## Error Handling

- quotas GET 실패: 배너만 미표시, 화면 블로킹 없음
- 한도 초과 429: 기존 `getErrorMessage` 경로 + 배너 0회 상태
- 빈 냉장고로 추천이 `quota: null`인 경우: peek 값 유지 (consume 안 했으므로)

## Testing (권장)

**백엔드**
- peek: 키 없음 → used=0, remaining=limit
- peek: 일부 사용 후 remaining 일치, consume과 값 일치
- GET `/quotas` 인증·응답 shape

**앱**
- 배너 문구 (N>0 / 0)
- 성공·429 후 배너 갱신
- quotas 실패 시 배너 숨김

## Implementation Order

1. `back`: `peek` + `GET /quotas` + 테스트
2. `app`: types · `api/quotas` · queryKey · 배너 UI
3. `app`: `recipes/index.tsx` · `add.tsx` 연동 및 캐시 갱신
