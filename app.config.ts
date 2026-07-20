import type { ConfigContext, ExpoConfig } from 'expo/config';

const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '';

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
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-image',
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
    ],
  };

  // Expo runtime still reads this; typings lag behind.
  (expoConfig as ExpoConfig & { newArchEnabled?: boolean }).newArchEnabled = true;
  return expoConfig;
};
