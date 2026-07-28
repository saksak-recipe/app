import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeKakaoSignup } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { verifyEmailHref } from '@/lib/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useKakaoSignupStore } from '@/stores/kakaoSignupStore';
import { authStyles } from '@/theme/authStyles';

export default function KakaoProfileScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const signupToken = useKakaoSignupStore((state) => state.signupToken);
  const clearSignupToken = useKakaoSignupStore((state) => state.clearSignupToken);

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
      clearSignupToken();
      if (data.status === 'needs_email_verification') {
        router.replace(
          verifyEmailHref({
            email: data.email,
            expiresIn: data.expires_in_seconds,
            source: 'kakao',
          }),
        );
        return;
      }

      await setSession(data.access_token, data.refresh_token, data.info);
      router.replace('/(main)');
    },
    onError: (err) => {
      setError(getErrorMessage(err, '가입에 실패했습니다.'));
    },
  });

  const canSubmit =
    !!signupToken &&
    email.trim().length > 0 &&
    nickname.trim().length >= 2;

  if (!signupToken) {
    return null;
  }

  return (
    <SafeAreaView style={authStyles.safe}>
      <View style={authStyles.blobTop} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={authStyles.flex}
      >
        <ScrollView
          contentContainerStyle={authStyles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.brand}>
            <Text style={authStyles.eyebrow}>삭삭</Text>
            <Text style={authStyles.title}>추가 정보</Text>
            <Text style={authStyles.subtitle}>
              카카오 가입을 완료하려면 닉네임과 이메일을 입력해 주세요. 입력한
              이메일로 인증 코드가 발송됩니다.
            </Text>
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

            {error ? <Text style={authStyles.error}>{error}</Text> : null}

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
              title="인증 메일 받기"
            />
            <Button
              disabled={mutation.isPending}
              onPress={() => {
                clearSignupToken();
                router.replace('/(auth)/login');
              }}
              title="돌아가기"
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
