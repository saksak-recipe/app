import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { clayShadowSoft } from '@/theme/shadows';

export function EmptyFridge() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="snow-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>냉장고가 비어 있어요</Text>
      <Text style={styles.desc}>식재료를 추가해 냉장고를 채워보세요.</Text>
      <View style={styles.hintPill}>
        <Text style={styles.hintText}>아래에서 추가해 보세요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...clayShadowSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  desc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  hintPill: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
