import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout as logoutApi } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { deleteMe, getMe, updateMe, updatePassword } from '@/api/users';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [checkedPassword, setCheckedPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMe,
  });

  useEffect(() => {
    if (profileQuery.data) {
      void updateUser(profileQuery.data);
      setNickname(profileQuery.data.nickname);
    }
  }, [profileQuery.data, updateUser]);

  const nicknameMutation = useMutation({
    mutationFn: () => updateMe({ nickname: nickname.trim() }),
    onSuccess: async (data) => {
      await updateUser(data);
      setError(null);
      Alert.alert('변경 완료', '닉네임을 변경했어요.');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      updatePassword({
        new_password: newPassword,
        checked_password: checkedPassword,
        current_password: user?.has_password ? currentPassword : undefined,
      }),
    onSuccess: async (data) => {
      await updateUser(data);
      setCurrentPassword('');
      setNewPassword('');
      setCheckedPassword('');
      setError(null);
      Alert.alert('변경 완료', '비밀번호를 변경했어요.');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      await clearSession();
      router.replace('/(auth)/login');
    },
    onError: (err) => Alert.alert('탈퇴 실패', getErrorMessage(err)),
  });

  const onLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const refresh = useAuthStore.getState().refreshToken;
            try {
              if (refresh) {
                await logoutApi(refresh);
              }
            } catch {
              // 서버 실패해도 로컬 세션은 지운다
            }
            await clearSession();
            router.replace('/(auth)/login');
          })();
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      '계정 탈퇴',
      '탈퇴 후 일정 기간 내 복구할 수 있습니다. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>내 계정</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <TextField
            label="닉네임"
            maxLength={20}
            onChangeText={setNickname}
            value={nickname}
          />
          <Button
            loading={nicknameMutation.isPending}
            disabled={nickname.trim().length < 2}
            onPress={() => nicknameMutation.mutate()}
            title="닉네임 저장"
            variant="secondary"
          />

          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          {user?.has_password ? (
            <TextField
              label="현재 비밀번호"
              onChangeText={setCurrentPassword}
              secureTextEntry
              value={currentPassword}
            />
          ) : null}
          <TextField
            label="새 비밀번호"
            maxLength={20}
            onChangeText={setNewPassword}
            secureTextEntry
            value={newPassword}
          />
          <TextField
            label="새 비밀번호 확인"
            maxLength={20}
            onChangeText={setCheckedPassword}
            secureTextEntry
            value={checkedPassword}
          />
          <Button
            loading={passwordMutation.isPending}
            disabled={
              newPassword.length < 8 ||
              newPassword !== checkedPassword ||
              (user?.has_password && currentPassword.length < 8)
            }
            onPress={() => passwordMutation.mutate()}
            title="비밀번호 변경"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.badges}>
            {user?.has_password ? (
              <Text style={styles.badge}>이메일 로그인</Text>
            ) : null}
            {user?.has_kakao ? <Text style={styles.badge}>카카오 연동</Text> : null}
          </View>
        </View>

        <View style={styles.card}>
          <Button title="로그아웃" variant="secondary" onPress={onLogout} />
          <Button
            loading={deleteMutation.isPending}
            onPress={onDeleteAccount}
            title="계정 탈퇴"
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    ...clayShadow,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  error: { color: colors.danger, fontSize: 14 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
