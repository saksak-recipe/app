import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeKakaoSignup } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

export default function KakaoProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ signup_token?: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const signupToken =
    typeof params.signup_token === 'string' ? params.signup_token : '';

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signupToken) {
      router.replace('/(auth)/login');
    }
  }, [signupToken, router]);

  const mutation = useMutation({
    mutationFn: completeKakaoSignup,
    onSuccess: async (data) => {
      await setSession(data.access_token, data.refresh_token, data.info);
      router.replace('/(main)');
    },
    onError: (err) => {
      setError(getErrorMessage(err, '가입에 실패했습니다.'));
    },
  });

  const canSubmit =
    signupToken.length > 0 &&
    email.trim().length > 0 &&
    nickname.trim().length >= 2;

  if (!signupToken) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blobTop} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.eyebrow}>삭삭</Text>
            <Text style={styles.title}>추가 정보</Text>
            <Text style={styles.subtitle}>
              카카오 가입을 완료하려면 닉네임과 이메일을 입력해 주세요
            </Text>
          </View>

          <View style={styles.card}>
            <TextField
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label="이메일"
              onChangeText={setEmail}
              placeholder="user@example.com"
              textContentType="emailAddress"
              value={email}
            />
            <TextField
              autoCorrect={false}
              label="닉네임"
              maxLength={20}
              onChangeText={setNickname}
              placeholder="2~20자"
              value={nickname}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              loading={mutation.isPending}
              disabled={!canSubmit}
              onPress={() => {
                setError(null);
                mutation.mutate({
                  signup_token: signupToken,
                  email: email.trim(),
                  nickname: nickname.trim(),
                });
              }}
              title="가입 완료"
            />
            <Button
              disabled={mutation.isPending}
              onPress={() => router.replace('/(auth)/login')}
              title="돌아가기"
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
    opacity: 0.85,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 28,
  },
  brand: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    ...clayShadow,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
});
