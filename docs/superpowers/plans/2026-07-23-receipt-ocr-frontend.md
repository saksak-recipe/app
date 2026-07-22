# 영수증 OCR 프론트엔드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 식재료 추가 화면에서 영수증을 스캔·업로드하면 OCR 후보를 입력란에 이어 붙이고, 기존 등록 API로 냉장고에 넣는다.

**Architecture:** `parseReceiptImage`로 multipart 업로드, `mergeIngredientNames`로 append+중복 제거, `useReceiptOcr`가 피커·권한·mutation을 묶고 `add.tsx`는 버튼·상태만 연결한다. 새 라우트 없음.

**Tech Stack:** Expo 57, `expo-image-picker`, Expo Router, React Native, TanStack Query (`useMutation`), Axios (`apiClient`), TypeScript

**Spec:** `docs/superpowers/specs/2026-07-23-receipt-ocr-frontend-design.md`

## Global Constraints

- 진입: `src/app/(main)/add.tsx`의 「영수증 스캔」만 (별도 라우트 없음)
- 이미지: 카메라 + 갤러리 (Alert 액션시트)
- OCR 결과: 기존 `rawInput`에 append, trim 기준 중복 제거
- 등록: 기존 `addIngredients` + `scope` 그대로
- OCR 요청 timeout: **60초** (기본 15초와 분리)
- multipart field명: `image` (jpg/jpeg/png/webp, 서버 한도 10MB)
- 빈 후보 문구: `식재료를 찾지 못했어요. 직접 입력해 주세요.`
- 후보 칩 UI·구매일 OCR·autofill 카피 없음
- 검증: `npx tsc --noEmit` (프로젝트에 Jest 없음). 병합 헬퍼는 Node로 스모크

## File Structure

| File | Responsibility |
|------|----------------|
| `src/types/api.ts` | `OcrReceiptResponse` |
| `src/api/ocr.ts` | `parseReceiptImage(uri, options?)` |
| `src/lib/receiptOcr.ts` | `mergeIngredientNames`, `parseNameList`, MIME/파일명 헬퍼 |
| `src/hooks/useReceiptOcr.ts` | 피커·권한·mutation·스캔 시작 |
| `src/app/(main)/add.tsx` | 스캔 버튼 + OCR 에러/빈결과 |
| `app.config.ts` | `expo-image-picker` 플러그인·권한 문구 |
| `package.json` / lock | `expo-image-picker` (~57) |

---

### Task 1: 의존성 + 타입 + OCR API + 병합 헬퍼

**Files:**
- Modify: `package.json` (via `npx expo install`)
- Modify: `app.config.ts`
- Modify: `src/types/api.ts`
- Create: `src/api/ocr.ts`
- Create: `src/lib/receiptOcr.ts`

**Interfaces:**
- Produces:
  - `OcrReceiptResponse = { ingredients: string[] }`
  - `parseReceiptImage(uri: string, options?: { mimeType?: string; fileName?: string; fileSize?: number | null }): Promise<OcrReceiptResponse>`
  - `parseNameList(raw: string): string[]`
  - `mergeIngredientNames(existingRaw: string, incoming: string[]): string`
  - `guessImageMeta(uri: string, mimeType?: string | null, fileName?: string | null): { mimeType: string; fileName: string }`
- Consumes: `apiClient` from `@/api/client`

- [ ] **Step 1: Install expo-image-picker**

Run:

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app && npx expo install expo-image-picker
```

Expected: `package.json`에 `expo-image-picker` ~57.x, lockfile 갱신.

- [ ] **Step 2: Register config plugin**

In `app.config.ts`, add to `plugins` array (after existing entries):

```typescript
[
  'expo-image-picker',
  {
    photosPermission: '영수증 사진을 불러와 식재료를 추가하려면 사진 접근이 필요합니다.',
    cameraPermission: '영수증을 촬영해 식재료를 추가하려면 카메라 접근이 필요합니다.',
    microphonePermission: false,
  },
],
```

- [ ] **Step 3: Add response type**

Append to `src/types/api.ts`:

```typescript
export type OcrReceiptResponse = {
  ingredients: string[];
};
```

- [ ] **Step 4: Create merge / meta helpers**

Create `src/lib/receiptOcr.ts`:

```typescript
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export function parseNameList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

export function mergeIngredientNames(
  existingRaw: string,
  incoming: string[],
): string {
  const existing = parseNameList(existingRaw);
  const seen = new Set(existing);
  const appended: string[] = [];

  for (const name of incoming) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    appended.push(trimmed);
  }

  if (appended.length === 0) {
    return existingRaw.trim();
  }

  if (existing.length === 0) {
    return appended.join(', ');
  }

  return `${existing.join(', ')}, ${appended.join(', ')}`;
}

export function guessImageMeta(
  uri: string,
  mimeType?: string | null,
  fileName?: string | null,
): { mimeType: string; fileName: string } {
  const lowerUri = uri.toLowerCase();
  let resolvedMime = mimeType ?? '';

  if (!resolvedMime) {
    if (lowerUri.endsWith('.png')) {
      resolvedMime = 'image/png';
    } else if (lowerUri.endsWith('.webp')) {
      resolvedMime = 'image/webp';
    } else if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) {
      resolvedMime = 'image/jpeg';
    } else {
      resolvedMime = 'image/jpeg';
    }
  }

  const allowed = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);
  if (!allowed.has(resolvedMime)) {
    throw new Error('지원하지 않는 이미지 형식입니다. jpg, png, webp만 가능합니다.');
  }

  if (fileName && fileName.trim().length > 0) {
    return { mimeType: resolvedMime, fileName: fileName.trim() };
  }

  const ext =
    resolvedMime === 'image/png'
      ? 'png'
      : resolvedMime === 'image/webp'
        ? 'webp'
        : 'jpg';

  return { mimeType: resolvedMime, fileName: `receipt.${ext}` };
}

export function assertReceiptWithinSize(fileSize?: number | null): void {
  if (typeof fileSize === 'number' && fileSize > MAX_RECEIPT_BYTES) {
    throw new Error('이미지가 10MB를 초과합니다. 더 작은 사진을 선택해 주세요.');
  }
}
```

- [ ] **Step 5: Smoke-test merge helper**

Run:

```bash
cd /Users/jeong-yeonghun/Desktop/saksak/app && npx --yes tsx -e "
import { mergeIngredientNames } from './src/lib/receiptOcr.ts';
const a = mergeIngredientNames('', ['계란', ' 왕교자 ']);
const b = mergeIngredientNames('계란, 우유', ['계란', '두부']);
const c = mergeIngredientNames('계란', []);
if (a !== '계란, 왕교자') throw new Error('a=' + a);
if (b !== '계란, 우유, 두부') throw new Error('b=' + b);
if (c !== '계란') throw new Error('c=' + c);
console.log('ok');
"
```

Expected: `ok`

(If `tsx` fails resolving path aliases, run the same assertions with a temporary relative import — the file has no `@/` imports.)

- [ ] **Step 6: Create OCR API**

Create `src/api/ocr.ts`:

```typescript
import { apiClient } from '@/api/client';
import {
  assertReceiptWithinSize,
  guessImageMeta,
} from '@/lib/receiptOcr';
import type { OcrReceiptResponse } from '@/types/api';

type ParseReceiptOptions = {
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

export async function parseReceiptImage(
  uri: string,
  options: ParseReceiptOptions = {},
): Promise<OcrReceiptResponse> {
  assertReceiptWithinSize(options.fileSize);
  const { mimeType, fileName } = guessImageMeta(
    uri,
    options.mimeType,
    options.fileName,
  );

  const formData = new FormData();
  formData.append('image', {
    uri,
    name: fileName,
    type: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
  } as unknown as Blob);

  const { data } = await apiClient.post<OcrReceiptResponse>(
    '/ocr/receipt',
    formData,
    {
      timeout: 60_000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}
```

- [ ] **Step 7: Typecheck**

Run: `cd /Users/jeong-yeonghun/Desktop/saksak/app && npx tsc --noEmit`  
Expected: exit 0 (or only pre-existing unrelated errors — newly added files clean).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json app.config.ts src/types/api.ts src/api/ocr.ts src/lib/receiptOcr.ts
git commit -m "$(cat <<'EOF'
Feat: 영수증 OCR API 클라이언트와 이름 병합 헬퍼 추가

EOF
)"
```

---

### Task 2: `useReceiptOcr` 훅

**Files:**
- Create: `src/hooks/useReceiptOcr.ts`

**Interfaces:**
- Consumes: `parseReceiptImage`, `mergeIngredientNames`, `getErrorMessage`, `expo-image-picker`
- Produces:
  - `useReceiptOcr(options: { onMerged: (nextRaw: string) => void; getCurrentRaw: () => string }): { isPending: boolean; error: string | null; emptyMessage: string | null; clearMessages: () => void; startScan: () => void }`

- [ ] **Step 1: Implement hook**

Create `src/hooks/useReceiptOcr.ts`:

```typescript
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { parseReceiptImage } from '@/api/ocr';
import { mergeIngredientNames } from '@/lib/receiptOcr';

type UseReceiptOcrOptions = {
  getCurrentRaw: () => string;
  onMerged: (nextRaw: string) => void;
};

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

const EMPTY_RESULT_MESSAGE =
  '식재료를 찾지 못했어요. 직접 입력해 주세요.';

export function useReceiptOcr({
  getCurrentRaw,
  onMerged,
}: UseReceiptOcrOptions) {
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (asset: PickedAsset) =>
      parseReceiptImage(asset.uri, {
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      }),
    onSuccess: (data) => {
      if (data.ingredients.length === 0) {
        setEmptyMessage(EMPTY_RESULT_MESSAGE);
        setError(null);
        return;
      }

      const next = mergeIngredientNames(getCurrentRaw(), data.ingredients);
      onMerged(next);
      setEmptyMessage(null);
      setError(null);
    },
    onError: (err) => {
      setEmptyMessage(null);
      setError(getErrorMessage(err, '영수증 인식에 실패했습니다.'));
    },
  });

  const clearMessages = useCallback(() => {
    setError(null);
    setEmptyMessage(null);
  }, []);

  const processAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset) => {
      if (!asset.uri) {
        setError('이미지를 가져오지 못했습니다.');
        return;
      }
      mutation.mutate({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      });
    },
    [mutation],
  );

  const openSettingsHint = useCallback((message: string) => {
    Alert.alert('권한 필요', message, [
      { text: '취소', style: 'cancel' },
      {
        text: '설정 열기',
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ]);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      openSettingsHint(
        '사진 라이브러리 접근이 필요합니다. 설정에서 권한을 허용해 주세요.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    processAsset(result.assets[0]);
  }, [openSettingsHint, processAsset]);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      openSettingsHint(
        '카메라 접근이 필요합니다. 설정에서 권한을 허용해 주세요.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    processAsset(result.assets[0]);
  }, [openSettingsHint, processAsset]);

  const startScan = useCallback(() => {
    if (mutation.isPending) {
      return;
    }

    clearMessages();

    const buttons = [
      {
        text: '카메라',
        onPress: () => {
          void pickFromCamera();
        },
      },
      {
        text: '갤러리',
        onPress: () => {
          void pickFromLibrary();
        },
      },
      { text: '취소', style: 'cancel' as const },
    ];

    if (Platform.OS === 'ios') {
      Alert.alert('영수증 스캔', '이미지를 선택하세요.', buttons);
    } else {
      Alert.alert('영수증 스캔', '이미지를 선택하세요.', buttons);
    }
  }, [
    clearMessages,
    mutation.isPending,
    pickFromCamera,
    pickFromLibrary,
  ]);

  return {
    isPending: mutation.isPending,
    error,
    emptyMessage,
    clearMessages,
    startScan,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0 for new hook (fix any ImagePicker type mismatches if API differs — prefer `mediaTypes: ['images']` per Expo 57 docs).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useReceiptOcr.ts
git commit -m "$(cat <<'EOF'
Feat: 영수증 OCR 피커·업로드 훅 추가

EOF
)"
```

---

### Task 3: `add.tsx`에 스캔 UI 연결

**Files:**
- Modify: `src/app/(main)/add.tsx`

**Interfaces:**
- Consumes: `useReceiptOcr` from `@/hooks/useReceiptOcr`
- Produces: 화면에서 OCR 스캔 → `rawInput` 갱신 → 기존 등록 플로우

- [ ] **Step 1: Wire hook and button**

At top of `AddIngredientScreen`, keep existing state. Add a ref or getter for current raw so merge uses latest value:

```typescript
import { useReceiptOcr } from '@/hooks/useReceiptOcr';
```

After `const [error, setError] = useState...` and `names` memo, add:

```typescript
const receiptOcr = useReceiptOcr({
  getCurrentRaw: () => rawInput,
  onMerged: (nextRaw) => {
    setRawInput(nextRaw);
  },
});
```

Note: `getCurrentRaw` closes over `rawInput`. Ensure the hook’s `onSuccess` calls `getCurrentRaw()` at success time (already does). Because `useCallback` in mutation may stale-close — the plan’s hook calls `getCurrentRaw()` inside `onSuccess`, which reads the latest function from the latest render if `mutation` is recreated each render. To avoid stale `rawInput`, prefer:

```typescript
const rawInputRef = useRef(rawInput);
rawInputRef.current = rawInput;

const receiptOcr = useReceiptOcr({
  getCurrentRaw: () => rawInputRef.current,
  onMerged: (nextRaw) => {
    setRawInput(nextRaw);
  },
});
```

Add `useRef` to the React import.

- [ ] **Step 2: UI — scan button + OCR messages**

Inside the card, place **after** the hint `Text`, **before** the 식재료 `TextField`:

```tsx
<Button
  title="영수증 스캔"
  variant="secondary"
  loading={receiptOcr.isPending}
  disabled={mutation.isPending}
  onPress={receiptOcr.startScan}
/>
```

Where errors are shown, combine:

```tsx
{receiptOcr.emptyMessage ? (
  <Text style={styles.hint}>{receiptOcr.emptyMessage}</Text>
) : null}

{(error ?? receiptOcr.error) ? (
  <Text style={styles.error}>{error ?? receiptOcr.error}</Text>
) : null}
```

Remove the old single `{error ? ...}` block to avoid duplicates.

On manual submit path `onSubmit`, call `receiptOcr.clearMessages()` when clearing local error, or leave OCR empty message until next scan — either is fine; prefer clearing on submit start:

```typescript
const onSubmit = () => {
  setError(null);
  receiptOcr.clearMessages();
  // ... existing validation
};
```

Disable 「냉장고에 넣기」 while OCR pending:

```tsx
<Button
  loading={mutation.isPending}
  disabled={names.length === 0 || receiptOcr.isPending}
  onPress={onSubmit}
  title="냉장고에 넣기"
/>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0.

- [ ] **Step 4: Manual checklist (dev client / simulator)**

1. 갤러리 영수증 → 이름이 입력란에 채워짐 → 등록 성공  
2. 카메라 → 동일  
3. 기존 `계란` + OCR에 `계란, 두부` → `계란, 두부`만 추가  
4. 식재료 없는 이미지 → 빈 결과 문구  
5. 권한 거부 → Alert  
6. `scope=group` 진입 시 그룹 냉장고 등록  

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/add.tsx
git commit -m "$(cat <<'EOF'
Feat: 식재료 추가 화면에 영수증 스캔 연결

EOF
)"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| `add.tsx` 진입 + 스캔 버튼 | Task 3 |
| 카메라 + 갤러리 | Task 2 |
| append + 중복 제거 | Task 1 `mergeIngredientNames` + Task 2/3 |
| `api/ocr.ts` + hook | Task 1–2 |
| FormData `image`, 60s timeout | Task 1 |
| `expo-image-picker` plugin | Task 1 |
| 빈 결과 문구 | Task 2–3 |
| 권한 Alert / 설정 | Task 2 |
| 기존 `addIngredients` + scope | Task 3 (변경 없음, 그대로 사용) |
| Out of scope (칩 UI 등) | 미포함 |

**Placeholder scan:** none. **Type consistency:** `OcrReceiptResponse.ingredients`, `parseReceiptImage`, `mergeIngredientNames`, `useReceiptOcr` 시그니처가 Task 간 일치.
