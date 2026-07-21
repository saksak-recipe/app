# In-App Notifications Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탭 헤더 벨·미읽음 뱃지와 알림 목록 화면으로 초대 수락/거절·유통기한 알림을 표시한다.

**Architecture:** `src/api/notifications.ts` + TanStack Query. Stack `/(main)/notifications` + 탭 `headerRight`의 `NotificationBell`. 초대는 기존 `groups.acceptInvite`/`rejectInvite` 재사용. 유통기한 행 탭 시 읽음 후 냉장고 탭으로 이동.

**Tech Stack:** Expo Router, React Native, TanStack Query, Axios (`apiClient`), TypeScript, StyleSheet + clay theme

**Spec:** `docs/superpowers/specs/2026-07-21-in-app-notifications-frontend-design.md`

## Global Constraints

- 진입: 4탭 공통 `headerRight` 벨 + unread 뱃지 → `/(main)/notifications`
- 초대: 행에 수락·거절 (`acceptInvite` / `rejectInvite`), 성공 후 `markRead` + invalidate
- 유통기한: 행 탭 → `markRead` → `router.replace('/(main)/(tabs)')`
- 낙관적 업데이트 없음; invalidate만
- unread refetchInterval ~60초 + focus
- 푸시·알림 설정·삭제 UI·재료 딥링크 없음
- 빈 상태 문구: `새 알림이 없어요`
- 검증: `npx tsc --noEmit` (프로젝트에 Jest 테스트 없음)

## File Structure

| File | Responsibility |
|------|----------------|
| `src/types/api.ts` | `Notification`, `UnreadCountResponse` |
| `src/api/notifications.ts` | list / unreadCount / markRead / markAllRead |
| `src/components/NotificationBell.tsx` | 벨 + 뱃지 → push notifications |
| `src/components/NotificationRow.tsx` | 행 UI + 초대 버튼 / expiry press |
| `src/app/(main)/notifications.tsx` | 목록 + 모두 읽음 |
| `src/app/(main)/_layout.tsx` | Stack.Screen `notifications` |
| `src/app/(main)/(tabs)/_layout.tsx` | `headerRight: NotificationBell` |

---

### Task 1: Types + notifications API

**Files:**
- Modify: `src/types/api.ts`
- Create: `src/api/notifications.ts`

**Interfaces:**
- Produces:
  - `NotificationType = 'group_invite' | 'expiry_soon' | 'expiry_expired'`
  - `Notification = { id, type, title, body, payload, is_read, created_at }`
  - `UnreadCountResponse = { count: number }`
  - `listNotifications()`, `getUnreadCount()`, `markNotificationRead(id)`, `markAllNotificationsRead()`
- Consumes: `apiClient` from `@/api/client`

- [ ] **Step 1: Add types**

Append to `src/types/api.ts` (after `GroupInvite` block is fine):

```typescript
export type NotificationType =
  | 'group_invite'
  | 'expiry_soon'
  | 'expiry_expired';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type UnreadCountResponse = {
  count: number;
};
```

- [ ] **Step 2: Add API module**

Create `src/api/notifications.ts`:

```typescript
import { apiClient } from '@/api/client';
import type { Notification, UnreadCountResponse } from '@/types/api';

export async function listNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications');
  return data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    '/notifications/unread-count',
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await apiClient.patch<Notification>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: exit 0 (no errors in new files)

- [ ] **Step 4: Commit**

```bash
git add src/types/api.ts src/api/notifications.ts
git commit -m "$(cat <<'EOF'
Feat: 알림 API 클라이언트와 타입 추가

EOF
)"
```

---

### Task 2: NotificationBell + tabs headerRight

**Files:**
- Create: `src/components/NotificationBell.tsx`
- Modify: `src/app/(main)/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `getUnreadCount`, query key `['notifications', 'unread-count']`
- Produces: `<NotificationBell />` used as `headerRight`

- [ ] **Step 1: Create NotificationBell**

Create `src/components/NotificationBell.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
      onPress={() => router.push('/(main)/notifications')}
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
```

- [ ] **Step 2: Wire tabs layout**

In `src/app/(main)/(tabs)/_layout.tsx`:

```tsx
import { NotificationBell } from '@/components/NotificationBell';
```

Inside `screenOptions` object, add:

```tsx
        headerRight: () => <NotificationBell />,
```

(Keep existing headerStyle / tabBar options.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/NotificationBell.tsx src/app/\(main\)/\(tabs\)/_layout.tsx
git commit -m "$(cat <<'EOF'
Feat: 탭 헤더 알림 벨과 미읽음 뱃지 추가

EOF
)"
```

---

### Task 3: NotificationRow + notifications screen + Stack

**Files:**
- Create: `src/components/NotificationRow.tsx`
- Create: `src/app/(main)/notifications.tsx`
- Modify: `src/app/(main)/_layout.tsx`

**Interfaces:**
- Consumes: `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `acceptInvite`, `rejectInvite`, `getErrorMessage`
- Query keys: `['notifications']`, `['notifications','unread-count']`, `['group']`

- [ ] **Step 1: Create NotificationRow**

Create `src/components/NotificationRow.tsx`:

```tsx
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import type { Notification } from '@/types/api';
import { colors } from '@/theme/colors';
import { clayShadowSoft } from '@/theme/shadows';

type Props = {
  item: Notification;
  busy?: boolean;
  onAcceptInvite?: () => void;
  onRejectInvite?: () => void;
  onPressExpiry?: () => void;
};

export function NotificationRow({
  item,
  busy = false,
  onAcceptInvite,
  onRejectInvite,
  onPressExpiry,
}: Props) {
  const isInvite = item.type === 'group_invite';
  const isExpiry =
    item.type === 'expiry_soon' || item.type === 'expiry_expired';

  const content = (
    <>
      <View style={styles.headerRow}>
        {!item.is_read ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
        <Text style={[styles.title, item.is_read && styles.readText]}>{item.title}</Text>
      </View>
      <Text style={[styles.body, item.is_read && styles.readText]}>{item.body}</Text>
      {isInvite ? (
        <View style={styles.actions}>
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Button
                title="수락"
                variant="primary"
                onPress={onAcceptInvite}
                style={styles.actionBtn}
              />
              <Button
                title="거절"
                variant="secondary"
                onPress={onRejectInvite}
                style={styles.actionBtn}
              />
            </>
          )}
        </View>
      ) : null}
    </>
  );

  if (isExpiry) {
    return (
      <Pressable
        onPress={onPressExpiry}
        style={[styles.card, !item.is_read && styles.unreadCard]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, !item.is_read && styles.unreadCard]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    ...clayShadowSoft,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotSpacer: {
    width: 8,
    height: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  readText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
```

If `clayShadowSoft` does not exist, use `clayShadow` from `@/theme/shadows` (check file and match existing cards in `group.tsx`).

- [ ] **Step 2: Create notifications screen**

Create `src/app/(main)/notifications.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      void listQuery.refetch();
      void queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    }, [listQuery, queryClient]),
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
      await markNotificationRead(item.id);
      await invalidateNotificationQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['group'] });
    } catch (err) {
      Alert.alert('수락 실패', getErrorMessage(err));
      try {
        await markNotificationRead(item.id);
        await invalidateNotificationQueries(queryClient);
      } catch {
        /* ignore secondary failure */
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
      await markNotificationRead(item.id);
      await invalidateNotificationQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['group'] });
    } catch (err) {
      Alert.alert('거절 실패', getErrorMessage(err));
      try {
        await markNotificationRead(item.id);
        await invalidateNotificationQueries(queryClient);
      } catch {
        /* ignore */
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
```

**Note on invite error handling:** Spec says on already-handled invite (404), Alert then mark read + refresh. The `catch` blocks above do that after showing the Alert.

- [ ] **Step 3: Register Stack screen**

In `src/app/(main)/_layout.tsx`, add after recipes screens:

```tsx
      <Stack.Screen name="notifications" options={{ title: '알림' }} />
```

- [ ] **Step 4: Fix shadow import if needed**

Open `src/theme/shadows.ts` and `src/app/(main)/(tabs)/group.tsx` — use the same shadow export name as group cards.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/NotificationRow.tsx src/app/\(main\)/notifications.tsx src/app/\(main\)/_layout.tsx
git commit -m "$(cat <<'EOF'
Feat: 알림 목록 화면과 초대 수락·거절 UI 추가

EOF
)"
```

---

### Task 4: Manual verification checklist

**Files:** none (verification only)

- [ ] **Step 1: Typecheck once more**

Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 2: Manual checklist (against backend with notifications)**

1. 로그인 → 모든 탭 헤더에 벨 표시
2. unread 0 → 뱃지 없음
3. 다른 계정에서 닉네임 초대 → 수신자 뱃지 증가 → 목록에 초대 행 → 수락 → 가족 탭 그룹 표시, 뱃지 감소
4. soon 재료 있는 계정 → 알림 목록 진입 시 임박 행 → 탭 → 냉장고 탭 이동, 읽음
5. 모두 읽음 → 뱃지 0
6. 빈 목록 문구 `새 알림이 없어요`

- [ ] **Step 3: No commit required** unless fixes were made; if fixes, commit with message describing the fix.

---

## Plan Self-Review

**Spec coverage:** Bell entry, list screen, invite accept/reject, expiry → fridge, mark all read, query keys, empty copy, out-of-scope items — Tasks 1–4.

**Placeholders:** None; shadow export name must be verified against `shadows.ts` in Task 3 Step 4.

**Type consistency:** `Notification` / `UnreadCountResponse` / API function names match across tasks.
