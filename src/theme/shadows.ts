import { Platform, type ViewStyle } from 'react-native';

export const clayShadowSoft: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  android: {
    elevation: 2,
  },
  default: {},
})!;
