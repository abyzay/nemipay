/* global jest */
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
