import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AmountDisplay } from '@/components/financial';
import { AppIcon } from '@/components/ui';
import { useAppTheme } from '@/hooks';

export interface CodiQrCardProps {
  amountCents: number;
  concept: string;
  qrPayload: string | null;
  qrSize: number;
  scanHint?: string;
  instructionText?: string;
  amountTestID?: string;
  stageTestID?: string;
  imageTestID?: string;
  instructionTestID?: string;
}

function isImagePayload(qrPayload: string): boolean {
  return (
    qrPayload.startsWith('data:image/') ||
    qrPayload.startsWith('http://') ||
    qrPayload.startsWith('https://')
  );
}

export function CodiQrCard({
  amountCents,
  concept,
  qrPayload,
  qrSize,
  scanHint = 'Escanea con CoDi para pagar',
  instructionText = 'Abre la app de tu banco → CoDi → Escanear',
  amountTestID = 'charge-amount-display',
  stageTestID = 'charge-qr-stage',
  imageTestID = 'charge-qr-image',
  instructionTestID = 'charge-instruction-text',
}: CodiQrCardProps) {
  const { tokens } = useAppTheme();

  return (
    <LinearGradient
      colors={['#5B00C4', '#740BE2', '#9F3EFF']}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0.75 }}
      end={{ x: 1, y: 0.15 }}
      style={[
        styles.heroQrCard,
        tokens.shadows.floating,
        {
          borderRadius: tokens.radius.radiusLarge,
          padding: tokens.spacing.space5,
          gap: tokens.spacing.space4,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.heroGlowOrb} />

      <View style={styles.heroAmountBlock}>
        <View style={styles.heroAmountRow}>
          <AmountDisplay
            amountCents={amountCents}
            size="display"
            tone="onPrimary"
            adjustsFontSizeToFit
            testID={amountTestID}
          />
          <Text
            style={[
              styles.heroCurrency,
              {
                fontFamily: tokens.typography.families.semiBold,
                color: 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            MXN
          </Text>
        </View>

        <Text
          numberOfLines={2}
          style={[
            styles.conceptText,
            {
              fontFamily: tokens.typography.families.medium,
              color: 'rgba(255, 255, 255, 0.88)',
            },
          ]}
        >
          {concept}
        </Text>
      </View>

      <View
        testID={stageTestID}
        style={[
          styles.qrStage,
          {
            backgroundColor: tokens.colors.background,
            borderRadius: tokens.radius.radiusBalanceCard,
            padding: tokens.spacing.space4 + 2,
          },
        ]}
      >
        {qrPayload ? (
          isImagePayload(qrPayload) ? (
            <Image
              source={{ uri: qrPayload }}
              style={{ width: qrSize, height: qrSize }}
              resizeMode="contain"
              testID={imageTestID}
            />
          ) : (
            <QRCode
              value={qrPayload}
              size={qrSize}
              color={tokens.colors.textPrimary}
              backgroundColor={tokens.colors.background}
            />
          )
        ) : (
          <View style={[styles.qrLoaderBox, { width: qrSize, height: qrSize }]}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        )}

        <Text
          style={[
            styles.qrScanHint,
            {
              fontFamily: tokens.typography.families.semiBold,
              color: tokens.colors.primary,
            },
          ]}
        >
          {scanHint}
        </Text>
      </View>

      <View
        style={[
          styles.noticeBanner,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            borderRadius: tokens.radius.radiusMD,
            paddingHorizontal: tokens.spacing.space3,
            paddingVertical: tokens.spacing.space2 + 2,
            gap: tokens.spacing.space2,
          },
        ]}
      >
        <AppIcon name="qr-code" size={18} color={tokens.colors.textOnPrimary} />
        <Text
          testID={instructionTestID}
          style={[
            styles.noticeText,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.textOnPrimary,
            },
          ]}
        >
          {instructionText}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroQrCard: {
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowOrb: {
    position: 'absolute',
    right: -36,
    top: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(208, 140, 255, 0.2)',
  },
  heroAmountBlock: {
    alignItems: 'center',
    gap: 4,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroCurrency: {
    fontSize: 15,
    lineHeight: 20,
  },
  conceptText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  qrStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrLoaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrScanHint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
