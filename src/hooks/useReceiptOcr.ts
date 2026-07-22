import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

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
    [mutation.mutate],
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

    Alert.alert('영수증 스캔', '이미지를 선택하세요.', buttons);
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
