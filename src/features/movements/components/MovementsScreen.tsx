import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { ScreenContainer } from '@/components/layout';
import { AppButton, AppChip, AppEmptyState, AppHeader, AppIcon } from '@/components/ui';
import { paymentKeys } from '@/features/payments/queries/keys';
import { useAppTheme } from '@/hooks';
import { useUiStore } from '@/stores';
import { fetchMovementsPage } from '../services';
import type { MovementFilter, TodayMovement } from '../types';
import { MovementRow } from './MovementRow';

const FILTER_OPTIONS: { id: MovementFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'received', label: 'Recibidos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'other', label: 'Otros' },
];

export function MovementsScreen() {
  const { tokens } = useAppTheme();
  const queryClient = useQueryClient();
  const authenticatedUser = useUiStore((state) => state.authenticatedUser);
  const enabled = Boolean(authenticatedUser?.id);

  const [filter, setFilter] = useState<MovementFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const movementsQuery = useInfiniteQuery({
    queryKey: paymentKeys.movements(filter, debouncedSearch),
    queryFn: ({ pageParam }) =>
      fetchMovementsPage({
        page: pageParam,
        filter,
        search: debouncedSearch,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled,
  });

  const movements = useMemo(
    () => movementsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [movementsQuery.data]
  );

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: paymentKeys.movements(filter, debouncedSearch),
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const handleLoadMore = () => {
    if (movementsQuery.hasNextPage && !movementsQuery.isFetchingNextPage) {
      void movementsQuery.fetchNextPage();
    }
  };

  const handleOpenMovement = (movement: TodayMovement) => {
    if (movement.billId) {
      router.push({ pathname: '/bill/[billId]', params: { billId: movement.billId } });
      return;
    }
    router.push({ pathname: '/collect', params: { chargeId: movement.id } });
  };

  const isRefreshing = movementsQuery.isRefetching && !movementsQuery.isFetchingNextPage;

  return (
    <ScreenContainer edges={['top']} style={styles.screenRoot}>
      <View pointerEvents="none" style={styles.backdropContainer}>
        <Svg
          width={220}
          height={150}
          viewBox="0 0 220 150"
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Path
            d="M220 30C155 18 96 52 62 104C46 128 38 140 34 150H220V30Z"
            fill={tokens.colors.lavender}
            fillOpacity={0.55}
          />
        </Svg>
      </View>

      <AppHeader
        title="Movimientos"
        onBackPress={handleBack}
        backTestID="activity-back-button"
        testID="activity-header"
      />

      <View
        style={[
          styles.searchContainer,
          {
            marginTop: tokens.spacing.space3,
            backgroundColor: isSearchFocused ? tokens.colors.background : tokens.colors.surface,
            borderColor: isSearchFocused ? tokens.colors.primary : tokens.colors.divider,
            borderRadius: tokens.radius.radiusFull,
            paddingHorizontal: tokens.spacing.space4,
            gap: tokens.spacing.space2 + 2,
          },
        ]}
      >
        <AppIcon
          name="search"
          size={19}
          color={isSearchFocused ? tokens.colors.primary : tokens.colors.textSecondary}
        />
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Buscar movimiento..."
          placeholderTextColor={tokens.colors.textSecondary}
          selectionColor={tokens.colors.primary}
          returnKeyType="search"
          accessibilityLabel="Buscar movimiento"
          testID="activity-search-input"
          style={[
            styles.searchInput,
            {
              fontFamily: tokens.typography.families.regular,
              color: tokens.colors.textPrimary,
            },
          ]}
        />
        {searchInput.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            hitSlop={8}
            onPress={() => {
              setSearchInput('');
              setDebouncedSearch('');
            }}
            testID="activity-search-clear"
            style={styles.clearButton}
          >
            <AppIcon name="close" size={16} color={tokens.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: tokens.spacing.space3, marginBottom: tokens.spacing.space2 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersRow, { gap: tokens.spacing.space2 }]}
        >
          {FILTER_OPTIONS.map((option) => (
            <AppChip
              key={option.id}
              label={option.label}
              selected={filter === option.id}
              onPress={() => setFilter(option.id)}
              testID={`activity-filter-${option.id}`}
            />
          ))}
        </ScrollView>
      </View>

      {movementsQuery.isLoading ? (
        <View style={styles.centered} testID="activity-loading">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : movementsQuery.isError ? (
        <View style={styles.centered}>
          <AppEmptyState
            icon="circle-alert"
            title="No pudimos cargar tus movimientos"
            description={movementsQuery.error?.message ?? 'Intenta actualizar en unos segundos.'}
            actions={<AppButton variant="primary" label="Reintentar" onPress={handleRefresh} />}
          />
        </View>
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.colors.primary}
            />
          }
          contentContainerStyle={
            movements.length === 0
              ? styles.emptyListContent
              : { paddingTop: tokens.spacing.space2, paddingBottom: tokens.spacing.space6 }
          }
          renderItem={({ item }) => (
            <MovementRow
              movement={item}
              onPress={handleOpenMovement}
              testID={`movement-row-${item.id}`}
            />
          )}
          ListFooterComponent={
            movementsQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader} testID="activity-pagination-loader">
                <ActivityIndicator size="small" color={tokens.colors.primary} />
              </View>
            ) : movementsQuery.hasNextPage ? (
              <View style={styles.footerButton}>
                <AppButton
                  variant="outlined"
                  size="md"
                  fullWidth={false}
                  label="Cargar más"
                  onPress={handleLoadMore}
                  testID="activity-load-more-button"
                />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <AppEmptyState
              icon="receipt"
              title={
                debouncedSearch || filter !== 'all' ? 'Sin resultados' : 'Aún no hay movimientos'
              }
              description={
                debouncedSearch || filter !== 'all'
                  ? 'Prueba con otro término de búsqueda o cambia el filtro.'
                  : 'Tus cobros CoDi aparecerán aquí al instante.'
              }
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    position: 'relative',
  },
  backdropContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  searchContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
