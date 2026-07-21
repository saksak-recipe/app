import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getUnreadCount } from '@/api/notifications';
import { colors } from '@/theme/colors';

export function NotificationBell() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const count = data?.count ?? 0;
  const badgeLabel = count > 99 ? '99+' : String(count);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="알림"
      hitSlop={8}
      onPress={() => router.push('/(main)/notifications' as Href)}
      style={styles.wrap}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.primaryDark} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 16,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
