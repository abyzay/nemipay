/* global jest */
process.env.EXPO_PUBLIC_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(async () => undefined),
  deactivateKeepAwake: jest.fn(async () => undefined),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
  digestStringAsync: jest.fn(async () => 'mock-sha256'),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      renderAsync: jest.fn(async () => ({
        saveAsync: jest.fn(async () => ({
          uri: 'file:///tmp/compressed.webp',
          width: 800,
          height: 800,
          base64: 'd2VicA==',
        })),
        release: jest.fn(),
      })),
      release: jest.fn(),
    })),
  },
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView, FlatList, Image } = require('react-native');

  const createSharedValue = (init) => {
    const state = { value: init };
    return {
      get value() {
        return state.value;
      },
      set value(next) {
        state.value = next;
      },
      get: () => state.value,
      set: (next) => {
        state.value = typeof next === 'function' ? next(state.value) : next;
      },
    };
  };

  return {
    __esModule: true,
    default: {
      View,
      Text,
      ScrollView,
      FlatList,
      Image,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: createSharedValue,
    useAnimatedStyle: (fn) => fn(),
    useReducedMotion: () => false,
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withRepeat: (animation) => animation,
  };
});
