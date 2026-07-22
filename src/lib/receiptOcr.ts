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
