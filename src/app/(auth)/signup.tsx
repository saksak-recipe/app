import { useMutation } from '@tanstack/react-query';
import { Link, useRouter, type Href } from 'expo-router';
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

import { signup } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors } from '@/theme/colors';
import { clayShadow } from '@/theme/shadows';

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [checkedPassword, setCheckedPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: async (data) => {
      router.replace({
        pathname: '/(auth)/verify-email',
        params: {
          email: data.email,
          expiresIn: String(data.expires_in_seconds),
        },
      } as unknown as Href);
    },
    onError: (err) => {
      setError(getErrorMessage(err, '회원가입에 실패했습니다.'));
    },
  });

  const canSubmit =
    email.trim().length > 0 &&
    nickname.trim().length >= 2 &&
    password.length >= 8 &&
    password.length <= 20 &&
    password === checkedPassword;

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
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>삭삭과 함께 냉장고를 정리해보세요</Text>
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
            <TextField
              label="비밀번호"
              maxLength={20}
              onChangeText={setPassword}
              placeholder="8~20자"
              secureTextEntry
              textContentType="newPassword"
              value={password}
            />
            <TextField
              label="비밀번호 확인"
              maxLength={20}
              onChangeText={setCheckedPassword}
              placeholder="비밀번호를 다시 입력"
              secureTextEntry
              textContentType="newPassword"
              value={checkedPassword}
            />

            {password.length > 0 &&
            checkedPassword.length > 0 &&
            password !== checkedPassword ? (
              <Text style={styles.error}>비밀번호가 일치하지 않습니다.</Text>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              loading={mutation.isPending}
              disabled={!canSubmit}
              onPress={() => {
                setError(null);
                mutation.mutate({
                  email: email.trim(),
                  nickname: nickname.trim(),
                  password,
                  checked_password: checkedPassword,
                });
              }}
              title="가입하기"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>이미 계정이 있나요?</Text>
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
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primarySoft,
    opacity: 0.8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    gap: 24,
  },
  brand: {
    gap: 6,
  },
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
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
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
