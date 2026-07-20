import { Platform, type ViewStyle } from 'react-native';

export const clayShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: {
    elevation: 4,
  },
  default: {},
})!;

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
