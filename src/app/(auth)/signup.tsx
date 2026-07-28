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

import { useMutation } from '@tanstack/react-query';

import { signup } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { verifyEmailHref } from '@/lib/navigation';
import { authStyles } from '@/theme/authStyles';
import { colors } from '@/theme/colors';

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
      router.replace(
        verifyEmailHref({
          email: data.email,
          expiresIn: data.expires_in_seconds,
        }),
      );
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
    <SafeAreaView style={authStyles.safe}>
      <View style={authStyles.blobTop} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={authStyles.flex}
      >
        <ScrollView
          contentContainerStyle={[authStyles.content, styles.content]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.brand}>
            <Text style={authStyles.eyebrow}>삭삭</Text>
            <Text style={authStyles.title}>회원가입</Text>
            <Text style={authStyles.subtitle}>삭삭과 함께 냉장고를 정리해보세요</Text>
          </View>

          <View style={authStyles.card}>
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
              <Text style={authStyles.error}>비밀번호가 일치하지 않습니다.</Text>
            ) : null}

            {error ? <Text style={authStyles.error}>{error}</Text> : null}

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
  content: {
    justifyContent: 'flex-start',
    paddingTop: 36,
    gap: 24,
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
    fontWeight: '600',
  },
});
