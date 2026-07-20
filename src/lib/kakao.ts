import { NativeModules, Platform } from 'react-native';

const RNKakaoLogins = NativeModules.RNKakaoLogins as object | null | undefined;

export function isKakaoNativeAvailable(): boolean {
  return Platform.OS !== 'web' && RNKakaoLogins != null;
}

export function getKakaoUnavailableMessage(): string {
  return '카카오 로그인은 Expo Go에서 사용할 수 없습니다. 개발 빌드(npx expo run:ios / run:android)로 실행해 주세요.';
}
