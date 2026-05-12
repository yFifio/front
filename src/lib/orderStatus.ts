export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

const DEFAULT_STATUS: OrderStatus = 'pending';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_BADGE_CLASSNAMES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const ALL_ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: ORDER_STATUS_LABELS.pending },
  { value: 'paid', label: ORDER_STATUS_LABELS.paid },
  { value: 'shipped', label: ORDER_STATUS_LABELS.shipped },
  { value: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { value: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
];

export const NON_SHIPPING_ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: ORDER_STATUS_LABELS.pending },
  { value: 'paid', label: ORDER_STATUS_LABELS.paid },
  { value: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { value: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
];

export const DELIVERY_ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'paid', label: ORDER_STATUS_LABELS.paid },
  { value: 'shipped', label: ORDER_STATUS_LABELS.shipped },
  { value: 'delivered', label: ORDER_STATUS_LABELS.delivered },
];

export const normalizeOrderStatus = (status: string | null | undefined): OrderStatus => {
  if (!status) return DEFAULT_STATUS;
  if ((status as OrderStatus) in ORDER_STATUS_LABELS) return status as OrderStatus;
  return DEFAULT_STATUS;
};

export const getOrderStatusLabel = (status: string | null | undefined): string => {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalized];
};

export const getOrderStatusClassName = (status: string | null | undefined): string => {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_BADGE_CLASSNAMES[normalized];
};
