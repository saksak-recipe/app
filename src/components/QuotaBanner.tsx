import { StyleSheet, Text, View } from 'react-native';

import { formatQuotaBannerText, type QuotaKind } from '@/lib/quota';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import type { QuotaInfo } from '@/types/api';

type QuotaBannerProps = {
  kind: QuotaKind;
  quota: QuotaInfo | null | undefined;
};

export function QuotaBanner({ kind, quota }: QuotaBannerProps) {
  if (!quota) {
    return null;
  }

  const exhausted = quota.remaining <= 0;

  return (
    <View style={[styles.wrap, exhausted && styles.wrapExhausted]}>
      <Text style={[styles.text, exhausted && styles.textExhausted]}>
        {formatQuotaBannerText(kind, quota.remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  wrapExhausted: {
    backgroundColor: colors.dangerSoft,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  textExhausted: {
    color: colors.danger,
  },
});
