import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmPasswordReset, requestPasswordReset } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

type Step = 'request' | 'confirm';

export default function PasswordResetScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [checkedPassword, setCheckedPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setStep('confirm');
      setError(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err, '재설정 요청에 실패했습니다.'));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
    onError: (err) => {
      setError(getErrorMessage(err, '비밀번호 재설정에 실패했습니다.'));
    },
  });

  const canRequest = email.trim().length > 0;
  const canConfirm =
    email.trim().length > 0 &&
    code.length === 6 &&
    password.length >= 8 &&
    password === checkedPassword;

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
            <Text style={styles.title}>비밀번호 재설정</Text>
            <Text style={styles.subtitle}>
              {step === 'request'
                ? '가입한 이메일로 재설정 코드를 보내드려요.'
                : '이메일로 받은 코드와 새 비밀번호를 입력해주세요.'}
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

            {step === 'confirm' ? (
              <>
                <TextField
                  keyboardType="number-pad"
                  label="인증 코드"
                  maxLength={6}
                  onChangeText={setCode}
                  placeholder="6자리 코드"
                  value={code}
                />
                <TextField
                  label="새 비밀번호"
                  maxLength={20}
                  onChangeText={setPassword}
                  placeholder="8~20자"
                  secureTextEntry
                  value={password}
                />
                <TextField
                  label="새 비밀번호 확인"
                  maxLength={20}
                  onChangeText={setCheckedPassword}
                  placeholder="비밀번호를 다시 입력"
                  secureTextEntry
                  value={checkedPassword}
                />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {step === 'request' ? (
              <Button
                loading={requestMutation.isPending}
                disabled={!canRequest}
                onPress={() => {
                  setError(null);
                  requestMutation.mutate({ email: email.trim() });
                }}
                title="재설정 코드 받기"
              />
            ) : (
              <Button
                loading={confirmMutation.isPending}
                disabled={!canConfirm}
                onPress={() => {
                  setError(null);
                  confirmMutation.mutate({
                    email: email.trim(),
                    code,
                    password,
                    checked_password: checkedPassword,
                  });
                }}
                title="비밀번호 변경"
              />
            )}
          </View>

          <View style={styles.footer}>
            <Link href="/(auth)/login" style={styles.link}>
              로그인으로 돌아가기
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
  error: { color: colors.danger, fontSize: 14 },
  footer: { alignItems: 'center' },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
