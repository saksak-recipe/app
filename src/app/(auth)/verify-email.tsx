import { useMutation } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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

import { resendVerificationEmail, verifyEmail } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

const DEFAULT_EXPIRES_IN_SECONDS = 180;

function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; expiresIn?: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const initialExpiresIn = Number(params.expiresIn) || DEFAULT_EXPIRES_IN_SECONDS;

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(initialExpiresIn);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: async (data) => {
      await setSession(data.access_token, data.refresh_token, data.info);
      router.replace('/(main)');
    },
    onError: (err) => {
      setError(getErrorMessage(err, '인증에 실패했습니다.'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: (data) => {
      setResent(true);
      setError(null);
      setRemainingSeconds(data.expires_in_seconds ?? DEFAULT_EXPIRES_IN_SECONDS);
    },
    onError: (err) => {
      setError(getErrorMessage(err, '인증 코드 재발송에 실패했습니다.'));
    },
  });

  const canSubmit =
    email.trim().length > 0 && code.length === 6 && remainingSeconds > 0;
  const canResend = email.trim().length > 0 && !resent && !verifyMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
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
            <Text style={styles.title}>이메일 인증</Text>
            <Text style={styles.subtitle}>
              가입하신 이메일로 발송된 6자리 인증 코드를 입력해주세요.
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
              value={email}
            />
            <TextField
              keyboardType="number-pad"
              label="인증 코드"
              maxLength={6}
              onChangeText={setCode}
              placeholder="6자리 코드"
              value={code}
            />

            <Text
              style={[
                styles.timer,
                remainingSeconds <= 0 ? styles.timerExpired : null,
              ]}
            >
              {remainingSeconds > 0
                ? `남은 시간 ${formatRemainingTime(remainingSeconds)}`
                : '인증 코드 입력 시간이 만료되었습니다. 재발송해 주세요.'}
            </Text>

            {resent ? (
              <Text style={styles.success}>인증 코드를 다시 보냈어요.</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              loading={verifyMutation.isPending}
              disabled={!canSubmit || resendMutation.isPending}
              onPress={() => {
                setError(null);
                verifyMutation.mutate({ email: email.trim(), code });
              }}
              title="인증 완료"
            />

            <Button
              loading={resendMutation.isPending}
              disabled={!canResend}
              onPress={() => {
                setError(null);
                resendMutation.mutate({ email: email.trim() });
              }}
              title={resent ? '재발송 완료' : '인증 코드 재발송'}
              variant="secondary"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>이미 인증하셨나요?</Text>
            <Link href="/(auth)/login" style={styles.link}>
              로그인
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    gap: 24,
  },
  brand: { gap: 6 },
  eyebrow: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
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
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    ...clayShadow,
  },
  timer: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  timerExpired: {
    color: colors.danger,
  },
  error: { color: colors.danger, fontSize: 14 },
  success: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
