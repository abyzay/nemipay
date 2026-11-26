import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton, AppChip, AppEmptyState, AppHeader, AppIcon } from '@/components/ui';
import { SplitSetupSheet } from '@/features/bills/components/SplitSetupSheet';
import { useCreateCharge } from '@/features/payments/hooks/useCreateCharge';
import { useAppTheme } from '@/hooks';
import { generateIdempotencyKey } from '@/services/security/crypto';
import { useUiStore } from '@/stores';
import {
  useArchiveCategoryMutation,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '../hooks/useCategories';
import {
  useArchiveProductMutation,
  useCreateProductMutation,
  useCreateProductsBatchMutation,
  useProductsQuery,
  useUpdateProductMutation,
} from '../hooks/useProducts';
import {
  DEFAULT_POS_CATEGORY,
  POS_TEMPLATES,
  calculateCartTotalCents,
  calculateCartUnitsCount,
} from '../services/productsService';
import type {
  PosCartItem,
  PosCategory,
  PosCategoryDraft,
  PosProduct,
  PosProductDraft,
} from '../types';
import { PosCategoryCard } from './PosCategoryCard';
import { PosCategoryFormModal } from './PosCategoryFormModal';
import { PosCheckoutBar } from './PosCheckoutBar';
import { PosOrderSummaryModal } from './PosOrderSummaryModal';
import { PosProductCard } from './PosProductCard';
import { PosProductFormModal } from './PosProductFormModal';

export interface PosScreenProps {
  onBackPress?: () => void;
  onChargeCreated?: (chargeId: string) => void;
}

type PosBrowseTab = 'products' | 'categories';

function chunkItems<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function matchesProductCategory(product: PosProduct, category: PosCategory): boolean {
  if (product.categoryId && product.categoryId === category.id) {
    return true;
  }
  return (
    (product.category?.trim().toLowerCase() || DEFAULT_POS_CATEGORY.toLowerCase()) ===
    category.name.trim().toLowerCase()
  );
}

export function PosScreen({ onBackPress, onChargeCreated }: PosScreenProps) {
  const { tokens } = useAppTheme();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const merchantId = authenticatedUser?.id;

  const productsQuery = useProductsQuery(Boolean(merchantId));
  const categoriesQuery = useCategoriesQuery(Boolean(merchantId));

  const createProductMutation = useCreateProductMutation(merchantId);
  const createBatchMutation = useCreateProductsBatchMutation(merchantId);
  const updateProductMutation = useUpdateProductMutation(merchantId);
  const archiveProductMutation = useArchiveProductMutation();

  const createCategoryMutation = useCreateCategoryMutation(merchantId);
  const updateCategoryMutation = useUpdateCategoryMutation(merchantId);
  const archiveCategoryMutation = useArchiveCategoryMutation();

  const createChargeMutation = useCreateCharge();

  const [browseTab, setBrowseTab] = useState<PosBrowseTab>('products');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [splitBillEnabled, setSplitBillEnabled] = useState(false);
  const [splitSheetVisible, setSplitSheetVisible] = useState(false);

  const [productFormVisible, setProductFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);

  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PosCategory | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);
  const lastSingleTapRef = useRef<{ productId: string; previousActiveId: string | null } | null>(
    null
  );

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const productCountsByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    for (const category of categories) {
      map.set(
        category.id,
        products.filter((product) => matchesProductCategory(product, category)).length
      );
    }
    return map;
  }, [categories, products]);

  const visibleProducts = useMemo(() => {
    if (browseTab === 'categories' && selectedCategory) {
      return products.filter((product) => matchesProductCategory(product, selectedCategory));
    }
    return products;
  }, [browseTab, products, selectedCategory]);

  const productRows = useMemo(() => chunkItems(visibleProducts, 3), [visibleProducts]);
  const categoryRows = useMemo(() => chunkItems(categories, 3), [categories]);

  const isCategoryOverview = browseTab === 'categories' && selectedCategory === null;

  const quantitiesById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  const activeItem = useMemo(() => {
    if (cartItems.length === 0) return null;
    if (activeProductId) {
      const matched = cartItems.find((item) => item.product.id === activeProductId);
      if (matched) return matched;
    }
    return cartItems[cartItems.length - 1] ?? null;
  }, [activeProductId, cartItems]);

  const totalCents = useMemo(() => calculateCartTotalCents(cartItems), [cartItems]);
  const unitsCount = useMemo(() => calculateCartUnitsCount(cartItems), [cartItems]);

  const resetIdempotencyIntent = () => {
    idempotencyKeyRef.current = null;
  };

  const incrementProduct = (product: PosProduct, trackAsSingleTap = false) => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    if (trackAsSingleTap) {
      lastSingleTapRef.current = {
        productId: product.id,
        previousActiveId: activeProductId,
      };
    } else {
      lastSingleTapRef.current = null;
    }

    setActiveProductId(product.id);
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

  const decrementProduct = (productId: string) => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    lastSingleTapRef.current = null;
    setCartItems((prev) => {
      const next = prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);
      if (next.length === 0) {
        setSummaryVisible(false);
        setActiveProductId(null);
      } else if (activeProductId === productId && !next.some((i) => i.product.id === productId)) {
        setActiveProductId(next[next.length - 1]?.product.id ?? null);
      }
      return next;
    });
  };

  const removeProductFromCart = (productId: string) => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    lastSingleTapRef.current = null;
    setCartItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      if (next.length === 0) {
        setSummaryVisible(false);
        setActiveProductId(null);
      } else if (activeProductId === productId) {
        setActiveProductId(next[next.length - 1]?.product.id ?? null);
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setErrorMessage(null);
    resetIdempotencyIntent();
    lastSingleTapRef.current = null;
    setSummaryVisible(false);
    setActiveProductId(null);
    setCartItems([]);
  };

  const handleDoubleTapEditProduct = (product: PosProduct) => {
    const pendingTap = lastSingleTapRef.current;
    if (pendingTap && pendingTap.productId === product.id) {
      lastSingleTapRef.current = null;
      resetIdempotencyIntent();
      setCartItems((prev) =>
        prev
          .map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter((item) => item.quantity > 0)
      );
      setActiveProductId(pendingTap.previousActiveId);
    }
    setEditingProduct(product);
    setProductFormVisible(true);
  };

  const handleLongPressEditProduct = (product: PosProduct) => {
    lastSingleTapRef.current = null;
    setEditingProduct(product);
    setProductFormVisible(true);
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
      setProductFormVisible(false);
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
      removeProductFromCart(productId);
      setProductFormVisible(false);
      setEditingProduct(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos eliminar el producto o servicio.'
      );
    }
  };

  const handleSaveCategory = async (draft: PosCategoryDraft, existingId?: string) => {
    setErrorMessage(null);
    try {
      if (existingId) {
        await updateCategoryMutation.mutateAsync({ categoryId: existingId, draft });
      } else {
        await createCategoryMutation.mutateAsync(draft);
      }
      setCategoryFormVisible(false);
      setEditingCategory(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar la categoría.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setErrorMessage(null);
    try {
      await archiveCategoryMutation.mutateAsync(categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
      setCategoryFormVisible(false);
      setEditingCategory(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos eliminar la categoría.');
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

  const handleGenerateQrCharge = async () => {
    if (splitBillEnabled) {
      if (totalCents < 200) {
        setErrorMessage('El monto mínimo para dividir cuenta es de $2.00 MXN.');
        return;
      }
      setErrorMessage(null);
      setSummaryVisible(false);
      setSplitSheetVisible(true);
      return;
    }

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

      setSummaryVisible(false);
      setCartItems([]);
      setActiveProductId(null);
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

  const handleHeaderAddPress = () => {
    if (isCategoryOverview) {
      setEditingCategory(null);
      setCategoryFormVisible(true);
    } else {
      setEditingProduct(null);
      setProductFormVisible(true);
    }
  };

  const isMutatingProduct =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    archiveProductMutation.isPending ||
    createBatchMutation.isPending;

  const isMutatingCategory =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    archiveCategoryMutation.isPending;

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { gap: tokens.spacing.space3 }]}>
      <AppHeader
        title="Punto de venta"
        onBackPress={onBackPress}
        backTestID="pos-back-button"
        testID="pos-header"
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isCategoryOverview ? 'Agregar nueva categoría' : 'Agregar nuevo producto'
              }
              onPress={handleHeaderAddPress}
              testID={isCategoryOverview ? 'pos-add-category-button' : 'pos-add-product-button'}
              style={({ pressed }) => [
                styles.headerIconBtn,
                {
                  backgroundColor: pressed ? tokens.colors.lavenderBorder : tokens.colors.lavender,
                  borderRadius: tokens.radius.radiusFull,
                },
              ]}
            >
              <AppIcon name="plus" size={20} color={tokens.colors.primary} />
            </Pressable>

            {unitsCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vaciar pedido actual"
                onPress={handleClearCart}
                testID="pos-clear-cart-button"
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    backgroundColor: pressed ? tokens.colors.errorLight : tokens.colors.surface,
                    borderRadius: tokens.radius.radiusFull,
                  },
                ]}
              >
                <AppIcon name="trash-2" size={18} color={tokens.colors.primaryDark} />
              </Pressable>
            ) : null}
          </View>
        }
      />

      <View
        style={[
          styles.segmentedTrack,
          {
            backgroundColor: tokens.colors.lavenderSoft,
            borderRadius: tokens.radius.radiusFull,
            padding: 4,
          },
        ]}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: browseTab === 'products' }}
          onPress={() => {
            setBrowseTab('products');
            setSelectedCategoryId(null);
          }}
          testID="pos-tab-products"
          style={[
            styles.segmentedTab,
            {
              backgroundColor: browseTab === 'products' ? tokens.colors.primary : 'transparent',
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
        >
          <Text
            style={[
              styles.segmentedTabText,
              {
                fontFamily: tokens.typography.families.semiBold,
                color:
                  browseTab === 'products'
                    ? tokens.colors.textOnPrimary
                    : tokens.colors.textPrimary,
              },
            ]}
          >
            Productos
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: browseTab === 'categories' }}
          onPress={() => {
            setBrowseTab('categories');
            setSelectedCategoryId(null);
          }}
          testID="pos-tab-categories"
          style={[
            styles.segmentedTab,
            {
              backgroundColor: browseTab === 'categories' ? tokens.colors.primary : 'transparent',
              borderRadius: tokens.radius.radiusFull,
            },
          ]}
        >
          <Text
            style={[
              styles.segmentedTabText,
              {
                fontFamily: tokens.typography.families.semiBold,
                color:
                  browseTab === 'categories'
                    ? tokens.colors.textOnPrimary
                    : tokens.colors.textPrimary,
              },
            ]}
          >
            Categorías
          </Text>
        </Pressable>
      </View>

      {browseTab === 'categories' && selectedCategory ? (
        <View style={styles.selectedCategoryBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedCategoryId(null)}
            testID="pos-categories-back-button"
            style={({ pressed }) => [
              styles.categoryBackChip,
              {
                backgroundColor: pressed ? tokens.colors.lavender : tokens.colors.surfaceSecondary,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon name="chevron-left" size={16} color={tokens.colors.textPrimary} />
            <Text
              style={[
                styles.categoryBackText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.textPrimary,
                },
              ]}
            >
              Categorías
            </Text>
          </Pressable>

          <Text
            numberOfLines={1}
            testID="pos-selected-category-title"
            style={[
              styles.selectedCategoryTitle,
              {
                fontFamily: tokens.typography.families.bold,
                color: tokens.colors.primary,
              },
            ]}
          >
            {selectedCategory.name}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditingCategory(selectedCategory);
              setCategoryFormVisible(true);
            }}
            testID="pos-selected-category-edit-button"
            style={[
              styles.categoryEditPill,
              {
                backgroundColor: tokens.colors.lavenderSoft,
                borderRadius: tokens.radius.radiusFull,
              },
            ]}
          >
            <AppIcon name="pencil" size={13} color={tokens.colors.primary} />
            <Text
              style={[
                styles.categoryEditText,
                {
                  fontFamily: tokens.typography.families.semiBold,
                  color: tokens.colors.primary,
                },
              ]}
            >
              Editar
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text
        style={[
          styles.gestureHint,
          {
            fontFamily: tokens.typography.families.regular,
            color: tokens.colors.textSecondary,
          },
        ]}
      >
        {isCategoryOverview
          ? '1 tap abre categoría · 2 taps edita o elimina'
          : '1 tap agrega al pedido · 2 taps edita o elimina'}
      </Text>

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

      {isCategoryOverview ? (
        <FlatList
          data={categoryRows}
          keyExtractor={(row, idx) => row[0]?.id ?? `cat-row-${idx}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.catalogList}
          contentContainerStyle={{
            gap: tokens.spacing.space2 + 2,
            paddingBottom: tokens.spacing.space3,
          }}
          renderItem={({ item: row }) => (
            <View style={[styles.gridRow, { gap: tokens.spacing.space2 + 2 }]}>
              {row.map((category) => (
                <PosCategoryCard
                  key={category.id}
                  category={category}
                  productsCount={productCountsByCategoryId.get(category.id) ?? 0}
                  onSingleTap={(target) => setSelectedCategoryId(target.id)}
                  onDoubleTapEdit={(target) => {
                    setEditingCategory(target);
                    setCategoryFormVisible(true);
                  }}
                />
              ))}
              {row.length < 3
                ? Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
                    <View key={`cat-empty-slot-${emptyIndex}`} style={styles.emptySlot} />
                  ))
                : null}
            </View>
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="tag"
              title="Crea tu primera categoría"
              description="Organiza tus productos con foto, nombre y descripción."
              testID="pos-categories-empty-state"
              actions={
                <AppButton
                  variant="primary"
                  size="md"
                  label="+ Nueva categoría"
                  onPress={() => {
                    setEditingCategory(null);
                    setCategoryFormVisible(true);
                  }}
                  testID="pos-categories-empty-add-button"
                />
              }
            />
          }
        />
      ) : (
        <FlatList
          data={productRows}
          keyExtractor={(row, idx) => row[0]?.id ?? `prod-row-${idx}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.catalogList}
          contentContainerStyle={{
            gap: tokens.spacing.space2 + 2,
            paddingBottom: tokens.spacing.space3,
          }}
          renderItem={({ item: row }) => (
            <View style={[styles.gridRow, { gap: tokens.spacing.space2 + 2 }]}>
              {row.map((product) => (
                <PosProductCard
                  key={product.id}
                  product={product}
                  quantity={quantitiesById.get(product.id) ?? 0}
                  isActive={activeItem?.product.id === product.id}
                  onSingleTap={(target) => incrementProduct(target, true)}
                  onDoubleTapEdit={handleDoubleTapEditProduct}
                  onLongPressEdit={handleLongPressEditProduct}
                />
              ))}
              {row.length < 3
                ? Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
                    <View key={`empty-slot-${emptyIndex}`} style={styles.emptySlot} />
                  ))
                : null}
            </View>
          )}
          ListEmptyComponent={
            <AppEmptyState
              icon="store"
              title={
                selectedCategory
                  ? `Sin productos en ${selectedCategory.name}`
                  : 'Agrega tu primer producto'
              }
              description="Sube una foto comprimida en WebP, nombre, descripción y precio."
              testID="pos-empty-state"
              actions={
                <View style={styles.emptyActions}>
                  <AppButton
                    variant="primary"
                    size="md"
                    label="+ Agregar producto"
                    onPress={() => {
                      setEditingProduct(null);
                      setProductFormVisible(true);
                    }}
                    testID="pos-empty-add-button"
                  />
                  {products.length === 0 ? (
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
                  ) : null}
                </View>
              }
            />
          }
        />
      )}

      <PosCheckoutBar
        unitsCount={unitsCount}
        totalCents={totalCents}
        activeItem={activeItem}
        disabled={totalCents < 100}
        loading={createChargeMutation.isPending}
        onIncrementActive={(product) => incrementProduct(product, false)}
        onDecrementActive={decrementProduct}
        onRemoveActive={removeProductFromCart}
        onOpenSummaryPress={() => setSummaryVisible(true)}
        onCobrarPress={() => {
          if (totalCents >= 100) {
            setErrorMessage(null);
            setSummaryVisible(true);
          }
        }}
      />

      {summaryVisible ? (
        <PosOrderSummaryModal
          visible
          cartItems={cartItems}
          unitsCount={unitsCount}
          totalCents={totalCents}
          isGeneratingQr={createChargeMutation.isPending}
          errorMessage={errorMessage}
          splitEnabled={splitBillEnabled}
          onToggleSplit={(next) => {
            setErrorMessage(null);
            setSplitBillEnabled(next);
          }}
          onIncrement={(product) => incrementProduct(product, false)}
          onDecrement={decrementProduct}
          onRemoveItem={removeProductFromCart}
          onModifyOrder={() => setSummaryVisible(false)}
          onConfirmGenerateQr={() => void handleGenerateQrCharge()}
        />
      ) : null}

      {splitSheetVisible ? (
        <SplitSetupSheet
          visible
          totalCents={totalCents}
          items={cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }))}
          onClose={() => setSplitSheetVisible(false)}
          onBillCreated={(billId) => {
            setSplitSheetVisible(false);
            setCartItems([]);
            setActiveProductId(null);
            setSplitBillEnabled(false);
            resetIdempotencyIntent();
            router.push({ pathname: '/bill/[billId]', params: { billId } });
          }}
        />
      ) : null}

      {productFormVisible ? (
        <PosProductFormModal
          key={editingProduct?.id ?? 'new-product'}
          visible
          editingProduct={editingProduct}
          categories={categories}
          defaultCategory={selectedCategory}
          isSaving={isMutatingProduct}
          onClose={() => {
            setProductFormVisible(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      ) : null}

      {categoryFormVisible ? (
        <PosCategoryFormModal
          key={editingCategory?.id ?? 'new-category'}
          visible
          editingCategory={editingCategory}
          isSaving={isMutatingCategory}
          onClose={() => {
            setCategoryFormVisible(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentedTab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabText: {
    fontSize: 14,
    lineHeight: 18,
  },
  selectedCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryBackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryBackText: {
    fontSize: 13,
    lineHeight: 17,
  },
  selectedCategoryTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  categoryEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryEditText: {
    fontSize: 12,
    lineHeight: 16,
  },
  gestureHint: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  catalogList: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  emptySlot: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
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
