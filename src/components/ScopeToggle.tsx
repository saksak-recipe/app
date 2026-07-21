import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { DataScope } from '@/types/api';

type ScopeToggleProps = {
  scope: DataScope;
  onChange: (scope: DataScope) => void;
  disabled?: boolean;
};

export function ScopeToggle({ scope, onChange, disabled }: ScopeToggleProps) {
  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      {(
        [
          { key: 'personal', label: '내 냉장고' },
          { key: 'group', label: '가족 냉장고' },
        ] as const
      ).map(({ key, label }) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: scope === key }}
          disabled={disabled}
          onPress={() => onChange(key)}
          style={[styles.tab, scope === key && styles.tabActive]}
        >
          <Text style={[styles.tabText, scope === key && styles.tabTextActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  disabled: {
    opacity: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});
