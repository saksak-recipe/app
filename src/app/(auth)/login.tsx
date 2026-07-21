import { useMutation } from '@tanstack/react-query';
import { Link, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { login as loginWithKakaoSdk } from '@react-native-seoul/kakao-login';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login, loginWithKakao } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import {
  getKakaoUnavailableMessage,
  isKakaoNativeAvailable,
} from '@/lib/kakao';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

function isKakaoCancelError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';
  return (
    message.includes('cancel') ||
    message.includes('cancelled') ||
    message.includes('canceled') ||
    message.includes('user cancelled')
  );
}

function isKakaoNativeMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : '';
  return (
    message.includes("cannot read property 'login' of null") ||
    message.includes("cannot read properties of null (reading 'login')") ||
    message.includes('rnkakaologins')
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      await setSession(data.access_token, data.refresh_token, data.info);
      router.replace('/(main)');
    },
    onError: (err) => {
      setError(getErrorMessage(err, '로그인에 실패했습니다.'));
    },
  });

  const kakaoMutation = useMutation({
    mutationFn: async () => {
      if (!isKakaoNativeAvailable()) {
        throw new Error(getKakaoUnavailableMessage());
      }
      const token = await loginWithKakaoSdk();
      return loginWithKakao(token.accessToken);
    },
    onSuccess: async (data) => {
      if (data.status === 'needs_profile') {
        router.push({
          pathname: '/(auth)/kakao-profile',
          params: { signup_token: data.signup_token },
        });
        return;
      }
      await setSession(data.access_token, data.refresh_token, data.info);
      router.replace('/(main)');
    },
    onError: (err) => {
      if (isKakaoCancelError(err)) {
        return;
      }
      if (isKakaoNativeMissingError(err)) {
        setError(getKakaoUnavailableMessage());
        return;
      }
      setError(getErrorMessage(err, '카카오 로그인에 실패했습니다.'));
    },
  });

  const canSubmit = email.trim().length > 0 && password.length >= 8;
  const isBusy = mutation.isPending || kakaoMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.logo}>삭삭</Text>
            <Text style={styles.subtitle}>냉장고 식재료를 가볍게 관리하세요</Text>
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
              label="비밀번호"
              onChangeText={setPassword}
              placeholder="8자 이상"
              secureTextEntry
              textContentType="password"
              value={password}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              loading={mutation.isPending}
              disabled={!canSubmit || isBusy}
              onPress={() => {
                setError(null);
                mutation.mutate({ email: email.trim(), password });
              }}
              title="로그인"
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={() => {
                setError(null);
                kakaoMutation.mutate();
              }}
              style={({ pressed }) => [
                styles.kakaoButton,
                pressed && !isBusy && styles.kakaoPressed,
                isBusy && styles.kakaoDisabled,
              ]}
            >
              {kakaoMutation.isPending ? (
                <ActivityIndicator color="#191919" />
              ) : (
                <Text style={styles.kakaoLabel}>카카오로 시작하기</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Link href={'/(auth)/password-reset' as Href} style={styles.forgotLink}>
              비밀번호를 잊으셨나요?
            </Link>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>아직 계정이 없나요?</Text>
              <Link href="/(auth)/signup" style={styles.link}>
                회원가입
              </Link>
            </View>
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
  blobBottom: {
    position: 'absolute',
    bottom: 40,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accentSoft,
    opacity: 0.55,
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
    gap: 10,
  },
  logo: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 16,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  kakaoButton: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 18,
  },
  kakaoPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  kakaoDisabled: {
    opacity: 0.5,
  },
  kakaoLabel: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  forgotLink: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
