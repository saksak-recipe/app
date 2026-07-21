import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/client';
import {
  acceptInvite,
  createGroup,
  dissolveGroup,
  getMyGroup,
  inviteByNickname,
  joinByCode,
  kickMember,
  leaveGroup,
  listMyInvites,
  rejectInvite,
  rotateInviteCode,
  updateMyGroup,
} from '@/api/groups';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useScopeStore } from '@/stores/scopeStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

export default function GroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setHasGroup = useScopeStore((state) => state.setHasGroup);

  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const groupQuery = useQuery({
    queryKey: ['group', 'me'],
    queryFn: getMyGroup,
    retry: false,
  });

  const invitesQuery = useQuery({
    queryKey: ['group', 'invites'],
    queryFn: listMyInvites,
    enabled: !groupQuery.isSuccess,
  });

  useEffect(() => {
    setHasGroup(groupQuery.isSuccess);
    if (groupQuery.data) {
      setRenameValue(groupQuery.data.name);
    }
  }, [groupQuery.isSuccess, groupQuery.data, setHasGroup]);

  const invalidateGroup = async () => {
    await queryClient.invalidateQueries({ queryKey: ['group'] });
    await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    await queryClient.invalidateQueries({ queryKey: ['shopping'] });
    await queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  const createMutation = useMutation({
    mutationFn: () => createGroup({ name: groupName.trim() }),
    onSuccess: async () => {
      setGroupName('');
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('생성 실패', getErrorMessage(err)),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinByCode({ invite_code: inviteCode.trim() }),
    onSuccess: async () => {
      setInviteCode('');
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('가입 실패', getErrorMessage(err)),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteByNickname({ nickname: inviteNickname.trim() }),
    onSuccess: () => {
      setInviteNickname('');
      Alert.alert('초대 완료', '초대를 보냈어요.');
    },
    onError: (err) => Alert.alert('초대 실패', getErrorMessage(err)),
  });

  const renameMutation = useMutation({
    mutationFn: () => updateMyGroup({ name: renameValue.trim() }),
    onSuccess: async () => {
      await invalidateGroup();
      Alert.alert('변경 완료', '그룹 이름을 변경했어요.');
    },
    onError: (err) => Alert.alert('변경 실패', getErrorMessage(err)),
  });

  const rotateMutation = useMutation({
    mutationFn: rotateInviteCode,
    onSuccess: async () => {
      await invalidateGroup();
      Alert.alert('재발급 완료', '새 초대 코드가 발급됐어요.');
    },
    onError: (err) => Alert.alert('재발급 실패', getErrorMessage(err)),
  });

  const leaveMutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: async () => {
      setHasGroup(false);
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('탈퇴 실패', getErrorMessage(err)),
  });

  const dissolveMutation = useMutation({
    mutationFn: dissolveGroup,
    onSuccess: async () => {
      setHasGroup(false);
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('해체 실패', getErrorMessage(err)),
  });

  const kickMutation = useMutation({
    mutationFn: kickMember,
    onSuccess: async () => {
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('추방 실패', getErrorMessage(err)),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: async () => {
      await invalidateGroup();
    },
    onError: (err) => Alert.alert('수락 실패', getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectInvite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['group', 'invites'] });
    },
    onError: (err) => Alert.alert('거절 실패', getErrorMessage(err)),
  });

  const isOwner = groupQuery.data?.owner_id === user?.id;
  const isBusy =
    createMutation.isPending ||
    joinMutation.isPending ||
    inviteMutation.isPending ||
    renameMutation.isPending ||
    rotateMutation.isPending ||
    leaveMutation.isPending ||
    dissolveMutation.isPending;

  if (groupQuery.isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (groupQuery.isSuccess && groupQuery.data) {
    const group = groupQuery.data;

    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.meta}>멤버 {group.members.length}명</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>초대 코드</Text>
              <Text style={styles.codeValue}>{group.invite_code}</Text>
            </View>

            {isOwner ? (
              <>
                <TextField
                  label="그룹 이름"
                  onChangeText={setRenameValue}
                  value={renameValue}
                />
                <Button
                  loading={renameMutation.isPending}
                  disabled={isBusy}
                  onPress={() => renameMutation.mutate()}
                  title="이름 변경"
                  variant="secondary"
                />
                <TextField
                  label="닉네임으로 초대"
                  onChangeText={setInviteNickname}
                  placeholder="초대할 닉네임"
                  value={inviteNickname}
                />
                <Button
                  loading={inviteMutation.isPending}
                  disabled={isBusy || inviteNickname.trim().length < 2}
                  onPress={() => inviteMutation.mutate()}
                  title="초대 보내기"
                />
                <Button
                  loading={rotateMutation.isPending}
                  disabled={isBusy}
                  onPress={() => rotateMutation.mutate()}
                  title="초대 코드 재발급"
                  variant="secondary"
                />
              </>
            ) : null}

            <Text style={styles.sectionTitle}>멤버</Text>
            {group.members.map((member) => (
              <View key={member.user_id} style={styles.memberRow}>
                <View>
                  <Text style={styles.memberName}>
                    {member.nickname}
                    {member.user_id === user?.id ? ' (나)' : ''}
                  </Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'owner' ? '방장' : '멤버'}
                  </Text>
                </View>
                {isOwner && member.user_id !== user?.id ? (
                  <Pressable
                    onPress={() => {
                      Alert.alert('멤버 추방', `${member.nickname}님을 추방할까요?`, [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '추방',
                          style: 'destructive',
                          onPress: () => kickMutation.mutate(member.user_id),
                        },
                      ]);
                    }}
                    style={styles.kickBtn}
                  >
                    <Text style={styles.kickText}>추방</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            <Button
              title="내 항목 가족으로 보내기"
              variant="secondary"
              onPress={() => router.push('/(main)/merge' as Href)}
            />

            {isOwner ? (
              <Button
                loading={dissolveMutation.isPending}
                disabled={isBusy}
                onPress={() => {
                  Alert.alert('그룹 해체', '그룹을 해체하면 모든 가족 데이터가 삭제됩니다.', [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '해체',
                      style: 'destructive',
                      onPress: () => dissolveMutation.mutate(),
                    },
                  ]);
                }}
                title="그룹 해체"
                variant="danger"
              />
            ) : (
              <Button
                loading={leaveMutation.isPending}
                disabled={isBusy}
                onPress={() => {
                  Alert.alert('그룹 탈퇴', '정말 그룹에서 나갈까요?', [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '탈퇴',
                      style: 'destructive',
                      onPress: () => leaveMutation.mutate(),
                    },
                  ]);
                }}
                title="그룹 탈퇴"
                variant="danger"
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const invites = invitesQuery.data ?? [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>가족 그룹</Text>
          <Text style={styles.subtitle}>
            가족과 냉장고와 장보기 목록을 함께 관리해보세요.
          </Text>

          <Text style={styles.sectionTitle}>그룹 만들기</Text>
          <TextField
            label="그룹 이름"
            onChangeText={setGroupName}
            placeholder="예: 우리집"
            value={groupName}
          />
          <Button
            loading={createMutation.isPending}
            disabled={isBusy || groupName.trim().length === 0}
            onPress={() => createMutation.mutate()}
            title="그룹 생성"
          />

          <Text style={styles.sectionTitle}>초대 코드로 참여</Text>
          <TextField
            autoCapitalize="characters"
            label="초대 코드"
            onChangeText={setInviteCode}
            placeholder="초대 코드 입력"
            value={inviteCode}
          />
          <Button
            loading={joinMutation.isPending}
            disabled={isBusy || inviteCode.trim().length === 0}
            onPress={() => joinMutation.mutate()}
            title="참여하기"
            variant="secondary"
          />
        </View>

        {invites.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>받은 초대</Text>
            {invites.map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteName}>{invite.group_name}</Text>
                  <Text style={styles.inviteMeta}>
                    {invite.inviter_nickname}님의 초대
                  </Text>
                </View>
                <View style={styles.inviteActions}>
                  <Button
                    loading={acceptMutation.isPending}
                    onPress={() => acceptMutation.mutate(invite.id)}
                    title="수락"
                    style={styles.inviteBtn}
                  />
                  <Button
                    loading={rejectMutation.isPending}
                    onPress={() => rejectMutation.mutate(invite.id)}
                    title="거절"
                    variant="ghost"
                    style={styles.inviteBtn}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    ...clayShadow,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  meta: { fontSize: 14, color: colors.textMuted },
  codeBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  codeLabel: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
  codeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.text },
  memberRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  kickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
  },
  kickText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  inviteRow: { gap: 10, paddingVertical: 8 },
  inviteInfo: { gap: 2 },
  inviteName: { fontSize: 16, fontWeight: '700', color: colors.text },
  inviteMeta: { fontSize: 13, color: colors.textMuted },
  inviteActions: { flexDirection: 'row', gap: 8 },
  inviteBtn: { flex: 1 },
});
