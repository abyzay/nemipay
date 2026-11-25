import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton, AppChip, AppEmptyState } from '@/components/ui';
import { useCreateCharge } from '@/features/payments/hooks/useCreateCharge';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { useUiStore } from '@/stores';
import {
  useArchiveProductMutation,
  useCreateProductMutation,
  useCreateProductsBatchMutation,
  useProductsQuery,
  useUpdateProductMutation,
} from '../hooks/useProducts';
import {
  POS_TEMPLATES,
  calculateCartTotalCents,
  calculateCartUnitsCount,
} from '../services/productsService';
import type { PosCartItem, PosProduct, PosProductDraft } from '../types';
import { PosCheckoutBar } from './PosCheckoutBar';
import { PosProductCard } from './PosProductCard';
import { PosProductFormModal } from './PosProductFormModal';
import { PosTotalBanner } from './PosTotalBanner';

export interface PosScreenProps {
  onChargeCreated?: (chargeId: string) => void;
}

export function PosScreen({ onChargeCreated }: PosScreenProps) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const merchantId = authenticatedUser?.id;

  const productsQuery = useProductsQuery(Boolean(merchantId));
  const createProductMutation = useCreateProductMutation(merchantId);
  const createBatchMutation = useCreateProductsBatchMutation(merchantId);
  const updateProductMutation = useUpdateProductMutation();
  const archiveProductMutation = useArchiveProductMutation();
  const createChargeMutation = useCreateCharge();

  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);

  const products = productsQuery.data ?? [];

  const quantitiesById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  const totalCents = useMemo(() => calculateCartTotalCents(cartItems), [cartItems]);
  const unitsCount = useMemo(() => calculateCartUnitsCount(cartItems), [cartItems]);

  const resetIdempotencyIntent = () => {
    idempotencyKeyRef.current = null;
  };

  const handleIncrementProduct = (product: PosProduct) => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex === -1) {
        return [...prev, { product, quantity: 1 }];
      }
      return prev.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item
      );
    });
  };

  const handleDecrementProduct = (productId: string) => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleClearCart = () => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    setCartItems([]);
  };

  const handleSaveProduct = async (draft: PosProductDraft, existingId?: string) => {
    setErrorMessage(null);
    try {
      if (existingId) {
        const updated = await updateProductMutation.mutateAsync({ productId: existingId, draft });
        setCartItems((prev) =>
          prev.map((item) =>
            item.product.id === existingId ? { ...item, product: updated } : item
          )
        );
      } else {
        await createProductMutation.mutateAsync(draft);
      }
      setFormVisible(false);
      setEditingProduct(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos guardar el producto o servicio.'
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setErrorMessage(null);
    try {
      await archiveProductMutation.mutateAsync(productId);
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      resetIdempotencyIntent();
      setFormVisible(false);
      setEditingProduct(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos eliminar el producto o servicio.'
      );
    }
  };

  const handleTemplatePress = async (templateId: string) => {
    const template = POS_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setErrorMessage(null);
    try {
      await createBatchMutation.mutateAsync(template.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos cargar la plantilla.');
    }
  };

  const handleQrCheckout = async () => {
    if (totalCents < 100 || createChargeMutation.isPending) {
      return;
    }

    setErrorMessage(null);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    try {
      const charge = await createChargeMutation.mutateAsync({
        input: {
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        },
        idempotencyKey: idempotencyKeyRef.current,
      });

      setCartItems([]);
      resetIdempotencyIntent();

      if (onChargeCreated) {
        onChargeCreated(charge.id);
      } else {
        router.push({ pathname: '/collect', params: { chargeId: charge.id } });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos generar el cobro CoDi.');
    }
  };

  const isMutatingProduct =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    archiveProductMutation.isPending ||
    createBatchMutation.isPending;

  if (productsQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
      <PosTotalBanner
        onAddPress={() => {
          setEditingProduct(null);
          setFormVisible(true);
        }}
      />

      {errorMessage ? (
        <Text
          testID="pos-error-message"
          style={[
            styles.errorText,
            {
              fontFamily: tokens.typography.families.medium,
              color: tokens.colors.error,
            },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.catalogList}
        columnWrapperStyle={{ gap: tokens.spacing.space3 }}
        contentContainerStyle={{
          gap: tokens.spacing.space3,
          paddingBottom: tokens.spacing.space3,
        }}
        renderItem={({ item }) => (
          <PosProductCard
            product={item}
            quantity={quantitiesById.get(item.id) ?? 0}
            onIncrement={handleIncrementProduct}
            onDecrement={handleDecrementProduct}
            onEditPress={(target) => {
              setEditingProduct(target);
              setFormVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          <AppEmptyState
            icon="store"
            title="Agrega tu primer producto o servicio"
            description="Arma tu lista con nombre y precio para cobrar con un toque."
            testID="pos-empty-state"
            actions={
              <View style={styles.emptyActions}>
                <AppButton
                  variant="primary"
                  size="md"
                  label="+ Agregar producto o servicio"
                  onPress={() => {
                    setEditingProduct(null);
                    setFormVisible(true);
                  }}
                  testID="pos-empty-add-button"
                />
                <View style={styles.templatesSection}>
                  <Text
                    style={[
                      styles.templatesHint,
                      {
                        fontFamily: tokens.typography.families.medium,
                        color: tokens.colors.textSecondary,
                      },
                    ]}
                  >
                    O carga ejemplos editables:
                  </Text>
                  <View style={styles.templatesRow}>
                    {POS_TEMPLATES.map((tpl) => (
                      <AppChip
                        key={tpl.id}
                        label={tpl.label}
                        selected={false}
                        onPress={() => void handleTemplatePress(tpl.id)}
                        testID={`pos-template-${tpl.id}`}
                      />
                    ))}
                  </View>
                </View>
              </View>
            }
          />
        }
      />

      <PosCheckoutBar
        unitsCount={unitsCount}
        totalCents={totalCents}
        disabled={totalCents < 100}
        loading={createChargeMutation.isPending}
        onQrCheckoutPress={() => void handleQrCheckout()}
        onClearCartPress={handleClearCart}
      />

      {formVisible ? (
        <PosProductFormModal
          key={editingProduct?.id ?? 'new-product'}
          visible
          editingProduct={editingProduct}
          isSaving={isMutatingProduct}
          onClose={() => {
            setFormVisible(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogList: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyActions: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  templatesSection: {
    alignItems: 'center',
    gap: 8,
  },
  templatesHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  templatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});
