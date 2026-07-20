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
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: '내 냉장고' }} />
      <Stack.Screen name="add" options={{ title: '식재료 추가', presentation: 'modal' }} />
      <Stack.Screen name="recipes/index" options={{ title: '레시피 추천' }} />
      <Stack.Screen name="recipes/detail" options={{ title: '레시피 상세' }} />
    </Stack>
  );
}
