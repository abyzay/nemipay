import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/layout';
import { AppButton, SurfaceCard } from '@/components/ui';
import { getMockDashboardData } from '@/features/business/services';
import { PaymentReceivedModal } from '@/features/payments/components';
import { useAppTheme } from '@/hooks';
import {
  buildCartConceptSummary,
  calculateCartTotalCents,
  calculateCartUnitsCount,
  filterPosProducts,
  getDefaultIconForCategory,
  getInitialPosProducts,
} from '../services';
import type { PosCartItem, PosCategory, PosProduct, PosProductDraft } from '../types';
import { PosCheckoutBar } from './PosCheckoutBar';
import { PosHeader } from './PosHeader';
import { PosProductCard } from './PosProductCard';
import { PosProductFormModal } from './PosProductFormModal';
import { PosSearchAndFilters } from './PosSearchAndFilters';
import { PosTotalBanner } from './PosTotalBanner';

export interface PosScreenProps {
  onClosePress: () => void;
  onQrCheckoutPress: (amountCents: number, concept: string) => void;
}

function formatCurrentTimeLabel(): string {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

export function PosScreen({ onClosePress, onQrCheckoutPress }: PosScreenProps) {
  const { tokens } = useAppTheme();
  const dashboardData = useMemo(() => getMockDashboardData(), []);

  const [products, setProducts] = useState<PosProduct[]>(() => getInitialPosProducts());
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PosCategory | 'Todos'>('Todos');

  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);
  const [confirmedSale, setConfirmedSale] = useState<{
    amountCents: number;
    timeLabel: string;
    concept: string;
  } | null>(null);

  const filteredProducts = useMemo(
    () => filterPosProducts(products, searchQuery, selectedCategory),
    [products, searchQuery, selectedCategory]
  );

  const quantitiesById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  const totalCents = useMemo(() => calculateCartTotalCents(cartItems), [cartItems]);
  const unitsCount = useMemo(() => calculateCartUnitsCount(cartItems), [cartItems]);

  const handleIncrementProduct = (product: PosProduct) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex === -1) {
        return [...prev, { product, quantity: 1 }];
      }
      return prev.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const handleDecrementProduct = (productId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSaveProduct = (draft: PosProductDraft, existingId?: string) => {
    if (existingId) {
      const updatedIcon = getDefaultIconForCategory(draft.category);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === existingId
            ? {
                ...item,
                name: draft.name,
                priceCents: draft.priceCents,
                category: draft.category,
                iconName: updatedIcon,
                imageUri: draft.imageUri,
              }
            : item
        )
      );
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === existingId
            ? {
                ...item,
                product: {
                  ...item.product,
                  name: draft.name,
                  priceCents: draft.priceCents,
                  category: draft.category,
                  iconName: updatedIcon,
                  imageUri: draft.imageUri,
                },
              }
            : item
        )
      );
    } else {
      const newProduct: PosProduct = {
        id: `prod_${Date.now()}`,
        name: draft.name,
        priceCents: draft.priceCents,
        category: draft.category,
        iconName: getDefaultIconForCategory(draft.category),
        imageUri: draft.imageUri,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }

    setFormVisible(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== productId));
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    setFormVisible(false);
    setEditingProduct(null);
  };

  const handleCashCheckout = () => {
    if (totalCents <= 0) {
      return;
    }

    setConfirmedSale({
      amountCents: totalCents,
      timeLabel: formatCurrentTimeLabel(),
      concept: `${buildCartConceptSummary(cartItems)} · Efectivo`,
    });
  };

  const handleQrCheckout = () => {
    if (totalCents <= 0) {
      return;
    }
    onQrCheckoutPress(totalCents, buildCartConceptSummary(cartItems));
  };

  const handleAcceptConfirmedSale = () => {
    setConfirmedSale(null);
    setCartItems([]);
  };

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.container, { gap: tokens.spacing.xs + 2 }]}>
        <PosHeader
          onAddProductPress={() => {
            setEditingProduct(null);
            setFormVisible(true);
          }}
          onClosePress={onClosePress}
        />

        <PosTotalBanner
          businessName={dashboardData.merchant.businessName}
          totalCents={totalCents}
          unitsCount={unitsCount}
          onClearCartPress={() => setCartItems([])}
        />

        <PosSearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.catalogList}
          columnWrapperStyle={{ gap: tokens.spacing.xs + 2 }}
          contentContainerStyle={{ gap: tokens.spacing.xs + 2, paddingBottom: tokens.spacing.sm }}
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
            <SurfaceCard style={styles.emptyCard} testID="pos-empty-state">
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    fontFamily: tokens.typography.families.semiBold,
                    color: tokens.colors.textPrimary,
                  },
                ]}
              >
                No encontramos ese producto
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  {
                    fontFamily: tokens.typography.families.regular,
                    color: tokens.colors.textSecondary,
                  },
                ]}
              >
                Puedes limpiar la búsqueda o crearlo al instante.
              </Text>
              <View
                style={[
                  styles.emptyActions,
                  { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
                ]}
              >
                <AppButton
                  variant="primary"
                  label={
                    searchQuery.trim() ? `Agregar "${searchQuery.trim()}"` : 'Agregar producto'
                  }
                  onPress={() => {
                    setEditingProduct(null);
                    setFormVisible(true);
                  }}
                  testID="pos-empty-add-button"
                />
                {searchQuery.trim() || selectedCategory !== 'Todos' ? (
                  <AppButton
                    variant="outlined"
                    label="Ver todos los productos"
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategory('Todos');
                    }}
                    testID="pos-empty-reset-button"
                  />
                ) : null}
              </View>
            </SurfaceCard>
          }
        />

        <PosCheckoutBar
          disabled={totalCents <= 0}
          onQrCheckoutPress={handleQrCheckout}
          onCashCheckoutPress={handleCashCheckout}
        />
      </View>

      {formVisible ? (
        <PosProductFormModal
          key={editingProduct?.id ?? `new-${searchQuery.trim()}`}
          visible
          editingProduct={editingProduct}
          initialName={editingProduct ? '' : searchQuery.trim()}
          onClose={() => {
            setFormVisible(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      ) : null}

      <PaymentReceivedModal
        visible={confirmedSale !== null}
        amountCents={confirmedSale?.amountCents ?? 0}
        timeLabel={confirmedSale?.timeLabel ?? ''}
        concept={confirmedSale?.concept}
        onAccept={handleAcceptConfirmedSale}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  catalogList: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyActions: {
    width: '100%',
  },
});
