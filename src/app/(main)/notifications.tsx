import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getErrorMessage } from '@/api/client';
import { acceptInvite, rejectInvite } from '@/api/groups';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';
import { NotificationRow } from '@/components/NotificationRow';
import type { Notification } from '@/types/api';
import { colors } from '@/theme/colors';

async function invalidateNotificationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
  ]);
}

async function markReadAfterInviteHandled(
  queryClient: ReturnType<typeof useQueryClient>,
  notificationId: string,
): Promise<void> {
  try {
    await markNotificationRead(notificationId);
    await invalidateNotificationQueries(queryClient);
  } catch {
    /* ignore */
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, [queryClient]),
  );

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await invalidateNotificationQueries(queryClient);
    },
    onError: (err) => Alert.alert('오류', getErrorMessage(err)),
  });

  const handleExpiryPress = async (item: Notification) => {
    try {
      if (!item.is_read) {
        await markNotificationRead(item.id);
        await invalidateNotificationQueries(queryClient);
      }
      router.replace('/(main)/(tabs)');
    } catch (err) {
      Alert.alert('오류', getErrorMessage(err));
    }
  };

  const handleAccept = async (item: Notification) => {
    const inviteId = item.payload.invite_id;
    if (typeof inviteId !== 'string') {
      Alert.alert('오류', '초대 정보가 올바르지 않습니다.');
      return;
    }
    setBusyId(item.id);
    try {
      await acceptInvite(inviteId);
      await queryClient.invalidateQueries({ queryKey: ['group'] });
      try {
        await markNotificationRead(item.id);
        await invalidateNotificationQueries(queryClient);
      } catch {
        Alert.alert(
          '알림',
          '초대는 처리됐지만 알림 읽음 처리에 실패했어요',
        );
      }
    } catch (err) {
      Alert.alert('수락 실패', getErrorMessage(err));
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) {
        await markReadAfterInviteHandled(queryClient, item.id);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item: Notification) => {
    const inviteId = item.payload.invite_id;
    if (typeof inviteId !== 'string') {
      Alert.alert('오류', '초대 정보가 올바르지 않습니다.');
      return;
    }
    setBusyId(item.id);
    try {
      await rejectInvite(inviteId);
      await queryClient.invalidateQueries({ queryKey: ['group'] });
      try {
        await markNotificationRead(item.id);
        await invalidateNotificationQueries(queryClient);
      } catch {
        Alert.alert(
          '알림',
          '초대는 처리됐지만 알림 읽음 처리에 실패했어요',
        );
      }
    } catch (err) {
      Alert.alert('거절 실패', getErrorMessage(err));
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404) {
        await markReadAfterInviteHandled(queryClient, item.id);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          <Text style={styles.markAll}>모두 읽음</Text>
        </Pressable>
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : listQuery.isError ? (
        <Text style={styles.empty}>{getErrorMessage(listQuery.error)}</Text>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <Text style={styles.empty}>새 알림이 없어요</Text>
      ) : (
        <FlatList
          data={listQuery.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              busy={busyId === item.id}
              onAcceptInvite={() => void handleAccept(item)}
              onRejectInvite={() => void handleReject(item)}
              onPressExpiry={() => void handleExpiryPress(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  markAll: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    color: colors.textMuted,
    fontSize: 15,
  },
});
