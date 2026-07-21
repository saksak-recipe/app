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
