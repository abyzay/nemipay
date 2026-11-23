export const paymentKeys = {
  all: ['payments'] as const,
  orders: () => [...paymentKeys.all, 'orders'] as const,
  orderDetail: (orderId: string) => [...paymentKeys.orders(), orderId] as const,
  orderStatus: (orderId: string) => [...paymentKeys.orderDetail(orderId), 'status'] as const,
} as const;
