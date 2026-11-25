import React, { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface PosCatalogCardProps {
  title: string;
  subtitle: string;
  description?: string | null;
  imageUrl?: string | null;
  fallbackIcon?: AppIconName;
  badgeCount?: number;
  selected?: boolean;
  isActive?: boolean;
  highlightSubtitle?: boolean;
  deferSingleTapMs?: number;
  accessibilityLabel: string;
  testID: string;
  badgeTestID?: string;
  imageTestID?: string;
  onSingleTap: () => void;
  onDoubleTapEdit: () => void;
  onLongPressEdit?: () => void;
}

const DOUBLE_TAP_DELAY_MS = 280;

export function resolvePosCategoryIcon(category?: string): AppIconName {
  const normalized = category?.toLowerCase() ?? '';
  if (
    normalized.includes('bebida') ||
    normalized.includes('café') ||
    normalized.includes('jugo') ||
    normalized.includes('refresco') ||
    normalized.includes('agua')
  ) {
    return 'CupSoda';
  }
  if (
    normalized.includes('alimento') ||
    normalized.includes('comida') ||
    normalized.includes('taco') ||
    normalized.includes('antojito')
  ) {
    return 'utensils';
  }
  if (
    normalized.includes('postre') ||
    normalized.includes('dulce') ||
    normalized.includes('fruta')
  ) {
    return 'cookie';
  }
  if (normalized.includes('servicio')) {
    return 'tag';
  }
  return 'store';
}

export function PosCatalogCard({
  title,
  subtitle,
  description,
  imageUrl,
  fallbackIcon = 'store',
  badgeCount = 0,
  selected = false,
  isActive = false,
  highlightSubtitle = false,
  deferSingleTapMs = 0,
  accessibilityLabel,
  testID,
  badgeTestID,
  imageTestID,
  onSingleTap,
  onDoubleTapEdit,
  onLongPressEdit,
}: PosCatalogCardProps) {
  const { tokens } = useAppTheme();
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    const now = Date.now();
    if (lastTapRef.current > 0 && now - lastTapRef.current <= DOUBLE_TAP_DELAY_MS) {
      lastTapRef.current = 0;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      onDoubleTapEdit();
      return;
    }
    lastTapRef.current = now;
    if (deferSingleTapMs > 0) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        onSingleTap();
      }, deferSingleTapMs);
      return;
    }
    onSingleTap();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onLongPress={onLongPressEdit ?? onDoubleTapEdit}
      delayLongPress={450}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        selected ? tokens.shadows.none : tokens.shadows.card,
        {
          backgroundColor: selected ? tokens.colors.lavenderSoft : tokens.colors.surfaceCard,
          borderColor: isActive
            ? tokens.colors.primary
            : selected
              ? tokens.colors.lavenderBorder
              : tokens.colors.border,
          borderWidth: isActive ? 1.5 : 1,
          borderRadius: tokens.radius.radiusCard,
          padding: tokens.spacing.space2,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.mediaFrame,
          {
            backgroundColor: selected ? tokens.colors.background : tokens.colors.surface,
            borderRadius: tokens.radius.radiusMD,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            testID={imageTestID}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <AppIcon
              name={fallbackIcon}
              size={24}
              color={selected ? tokens.colors.primary : tokens.colors.textSecondary}
            />
          </View>
        )}

        {badgeCount > 0 ? (
          <View
            testID={badgeTestID}
            style={[
              styles.qtyBadge,
              {
                backgroundColor: tokens.colors.primary,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <Text
              style={[
                styles.qtyBadgeText,
                tokens.typography.tabularNums,
                {
                  fontFamily: tokens.typography.families.bold,
                  color: tokens.colors.textOnPrimary,
                },
              ]}
            >
              {badgeCount}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoBlock}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.textPrimary,
            },
          ]}
        >
          {title}
        </Text>

        {description ? (
          <Text
            numberOfLines={1}
            style={[
              styles.description,
              {
                fontFamily: tokens.typography.families.regular,
                color: tokens.colors.textSecondary,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}

        <Text
          numberOfLines={1}
          style={[
            styles.subtitle,
            tokens.typography.tabularNums,
            {
              fontFamily: tokens.typography.families.bold,
              color: highlightSubtitle ? tokens.colors.primary : tokens.colors.textPrimary,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  mediaFrame: {
    width: '100%',
    height: 76,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  infoBlock: {
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 2,
  },
});
