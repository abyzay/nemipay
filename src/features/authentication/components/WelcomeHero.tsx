import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { APP_ASSETS } from '@/constants/assets';
import { useAppTheme } from '@/hooks';
import { WelcomeIllustration } from './WelcomeIllustration';

export interface WelcomeSlide {
  id: string;
  subtitle: string;
  image: ImageSourcePropType;
  accessibilityLabel: string;
  illustrationTestID: string;
}

export const WELCOME_SLIDES: readonly WelcomeSlide[] = [
  {
    id: 'collect',
    subtitle: 'Cobra, recibe y\nhaz crecer tu negocio',
    image: APP_ASSETS.welcomeQr,
    accessibilityLabel: 'Ilustración de cobro con código QR de NemiPay',
    illustrationTestID: 'welcome-illustration',
  },
  {
    id: 'receive',
    subtitle: 'Recibe pagos al instante\nsin complicaciones',
    image: APP_ASSETS.welcomeReceive,
    accessibilityLabel: 'Ilustración de pagos instantáneos recibidos en NemiPay',
    illustrationTestID: 'welcome-illustration-receive',
  },
  {
    id: 'growth',
    subtitle: 'Controla tus ventas y\nhaz crecer tu negocio',
    image: APP_ASSETS.welcomeGrowth,
    accessibilityLabel: 'Ilustración de crecimiento y reportes de negocio en NemiPay',
    illustrationTestID: 'welcome-illustration-growth',
  },
];

export function WelcomeHero() {
  const { tokens } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<WelcomeSlide>>(null);

  const slideWidth = Math.max(windowWidth, 1);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / slideWidth);
    if (nextIndex >= 0 && nextIndex < WELCOME_SLIDES.length) {
      setActiveIndex(nextIndex);
    }
  };

  const handleDotPress = (index: number) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <View style={[styles.container, { paddingTop: tokens.spacing.space3 }]}>
      <FlatList
        ref={flatListRef}
        data={WELCOME_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        testID="welcome-carousel"
        style={styles.carousel}
        renderItem={({ item }) => (
          <View
            style={[
              styles.slide,
              {
                width: slideWidth,
                paddingHorizontal: tokens.layout.screenHorizontalPadding,
              },
            ]}
          >
            <Text
              style={[
                styles.subtitle,
                {
                  fontFamily: tokens.typography.families.medium,
                  fontSize: tokens.typography.scale.h4.fontSize,
                  lineHeight: 25,
                  letterSpacing: tokens.typography.scale.h4.letterSpacing,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              {item.subtitle}
            </Text>

            <View style={[styles.illustrationWrapper, { marginTop: tokens.spacing.space4 }]}>
              <WelcomeIllustration
                source={item.image}
                accessibilityLabel={item.accessibilityLabel}
                testID={item.illustrationTestID}
              />
            </View>
          </View>
        )}
      />

      <View
        style={[
          styles.pagination,
          {
            gap: tokens.spacing.space2,
            marginBottom: tokens.spacing.space4,
          },
        ]}
        accessibilityRole="tablist"
        testID="welcome-pagination"
      >
        {WELCOME_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={slide.id}
              accessibilityRole="tab"
              accessibilityLabel={`Diapositiva ${index + 1} de ${WELCOME_SLIDES.length}`}
              accessibilityState={{ selected: isActive }}
              hitSlop={8}
              onPress={() => handleDotPress(index)}
              testID={`welcome-dot-${index}`}
              style={[
                styles.dot,
                {
                  width: isActive ? 8 : 7,
                  height: isActive ? 8 : 7,
                  borderRadius: tokens.radius.radiusFull,
                  backgroundColor: isActive ? tokens.colors.primary : tokens.colors.gray[300],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  carousel: {
    flex: 1,
    width: '100%',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    textAlign: 'center',
  },
  illustrationWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
});
