import type { ConfigContext, ExpoConfig } from 'expo/config';

const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '';

if (!kakaoAppKey) {
  console.warn(
    '[config] EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY가 비어 있습니다. 카카오 로그인이 동작하지 않을 수 있습니다.',
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig: ExpoConfig = {
    ...config,
    name: '삭삭',
    slug: 'saksak',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'saksak',
    userInterfaceStyle: 'light',
    experiments: {
      typedRoutes: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.saksak.app',
      infoPlist: {
        NSCameraUsageDescription:
          '영수증을 촬영해 식재료를 추가하려면 카메라 접근이 필요합니다.',
        NSPhotoLibraryUsageDescription:
          '영수증 사진을 불러와 식재료를 추가하려면 사진 접근이 필요합니다.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1B7A4E',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.saksak.app',
      permissions: ['CAMERA', 'READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE'],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey,
          kotlinVersion: '2.0.21',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: [
              'https://devrepo.kakao.com/nexus/content/groups/public/',
            ],
          },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: '영수증 사진을 불러와 식재료를 추가하려면 사진 접근이 필요합니다.',
          cameraPermission: '영수증을 촬영해 식재료를 추가하려면 카메라 접근이 필요합니다.',
          microphonePermission: false,
        },
      ],
    ],
  };

  // Expo runtime still reads these; typings lag behind.
  (expoConfig as ExpoConfig & {
    newArchEnabled?: boolean;
    splash?: {
      image: string;
      resizeMode: 'contain' | 'cover';
      backgroundColor: string;
    };
  }).newArchEnabled = true;
  (expoConfig as ExpoConfig & {
    splash?: {
      image: string;
      resizeMode: 'contain' | 'cover';
      backgroundColor: string;
    };
  }).splash = {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ECFDF5',
  };
  return expoConfig;
};
