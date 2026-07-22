# 영수증 OCR 프론트엔드

날짜: 2026-07-23  
상태: Approved (대화에서 섹션별 승인 완료)  
관련 백엔드: `POST /api/v1/ocr/receipt` (`docs` in back: `2026-07-23-naver-ocr-receipt-ingredients-design.md`)

## Goal

식재료 추가 화면에서 영수증 이미지를 고르면, 서버 OCR로 받은 식재료 후보를  
기존 입력란에 이어 붙인 뒤, 사용자가 확인·수정하고 기존 등록 API로 냉장고에 넣는다.

## Decisions

| 항목 | 선택 |
|------|------|
| 진입점 | **A.** 기존 `식재료 추가`(`add.tsx`)에 「영수증 스캔」 |
| 이미지 소스 | **C.** 카메라 + 갤러리 (액션시트) |
| OCR 결과 병합 | **B.** 기존 `rawInput`에 append, 중복 제거 |
| 구현 구조 | **2.** `api/ocr.ts` + `useReceiptOcr` 훅, UI는 `add.tsx`만 보강 |
| 등록 | 기존 `addIngredients` + `scope` 파라미터 그대로 |
| 유통기한 | 스캔 후에도 비우면 서버 shelf-life autofill (프론트 변경 없음) |

## Out of Scope

- 별도 영수증 스캔 라우트 / 후보 칩 개별 삭제 UI
- 구매일·유통기한·수량 OCR 추출
- 유통기한 autofill 안내 카피 (별도 요청 시)
- 이미지 로컬·원격 영구 저장

## Flow

```
[식재료 추가]
  「영수증 스캔」
    → ActionSheet: 카메라 / 갤러리 / 취소
    → expo-image-picker (권한 요청 포함)
    → POST /ocr/receipt multipart field `image`
    → { ingredients: string[] }
    → rawInput append + case-sensitive trim 중복 제거
    → (빈 배열) 안내 메시지
  사용자 확인·수정 → 「냉장고에 넣기」
    → POST /ingredients 또는 /groups/me/ingredients
```

## Components

| 구성 | 역할 |
|------|------|
| `src/api/ocr.ts` | `parseReceiptImage(uri: string): Promise<OcrReceiptResponse>` — FormData, `Content-Type`은 multipart에 맡김 |
| `src/hooks/useReceiptOcr.ts` | 액션시트·피커·권한·mutation·`mergeIngredientNames` |
| `src/app/(main)/add.tsx` | 스캔 버튼, OCR 로딩/에러, 성공 시 `setRawInput` |
| `src/types/api.ts` | `OcrReceiptResponse { ingredients: string[] }` |
| `app.config.ts` | `expo-image-picker` 플러그인 + iOS/Android 권한 문구 |
| `package.json` | `expo-image-picker` (SDK 57 호환 버전) |

새 Stack 화면은 추가하지 않는다.

## API Client Notes

- `apiClient` 기본 `Content-Type: application/json`이 FormData를 깨지 않도록, OCR 요청에서 헤더를 덮어쓰거나 FormData 사용 시 axios가 boundary를 설정하게 한다.
- OCR+LLM은 느릴 수 있으므로 **이 요청만** timeout을 60초로 둔다 (기본 15초와 분리).
- 필드명 `image`, MIME jpg/jpeg/png/webp, 서버 한도 10MB. 가능하면 클라이언트에서 크기 사전 안내.

## UI

- 「영수증 스캔」: 식재료 필드 근처, 기존 `Button` 스타일 (ghost/secondary).
- OCR 진행 중: 스캔 버튼 로딩. 등록 mutation과 충돌하지 않게 OCR 중에는 스캔 재진입 방지.
- 성공: 입력란·미리보기 pill만 갱신 (별도 성공 모달 없음).
- `ingredients: []`: 「식재료를 찾지 못했어요. 직접 입력해 주세요.」

## Error Handling

| 상황 | 처리 |
|------|------|
| 권한 거부 | Alert + (가능하면) 설정 이동 안내 |
| 피커 취소 | no-op |
| 검증/OCR/LLM/네트워크 | `getErrorMessage` → 화면 에러 텍스트 |
| 10MB 초과 | 사전 차단 또는 서버 detail 표시 |

## Merge Rules

1. OCR 이름 trim, 빈 문자열 제외.
2. 기존 `rawInput`을 `,`/`\n`으로 분리한 집합과 비교해 **이미 있는 이름은 건너뛴다** (대소문자·공백 trim 기준 일치).
3. 새 이름만 뒤에 `, `로 이어 붙인다. 기존이 비어 있으면 이름만 넣는다.

## Testing (수동)

1. 갤러리 영수증 → 후보가 입력란에 채워지고 등록 성공.
2. 카메라 촬영 → 동일.
3. 이미 입력된 이름 + OCR → 중복 없이 append.
4. 식재료 없는 이미지 → 빈 결과 안내.
5. 권한 거부 / 네트워크 실패 → 에러·Alert.
6. `scope=group`으로 진입 시 그룹 냉장고에 등록.
