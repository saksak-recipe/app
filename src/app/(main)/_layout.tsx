import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerBackTitle: '뒤로',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: '식재료 추가', presentation: 'modal' }} />
      <Stack.Screen
        name="edit-ingredient"
        options={{ title: '식재료 수정', presentation: 'modal' }}
      />
      <Stack.Screen name="merge" options={{ title: '가족으로 보내기' }} />
      <Stack.Screen name="recipes/index" options={{ title: '만개의레시피' }} />
      <Stack.Screen name="recipes/saved" options={{ title: '저장한 레시피' }} />
      <Stack.Screen name="recipes/detail" options={{ title: '레시피 상세' }} />
      <Stack.Screen name="notifications" options={{ title: '알림' }} />
    </Stack>
  );
}
