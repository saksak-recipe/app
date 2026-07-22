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
