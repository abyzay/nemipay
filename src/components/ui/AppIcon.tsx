import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Building2,
  Calendar,
  Camera,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  Coffee,
  Cookie,
  CreditCard,
  CupSoda,
  Droplets,
  EllipsisVertical,
  Eye,
  EyeOff,
  Home,
  Image as ImageIcon,
  Lock,
  Mail,
  Minus,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Tag,
  Trash2,
  UserRound,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks';

const LUCIDE_ICON_MAP = {
  // Navegación y acciones principales requeridas por el Design System
  Home,
  ArrowLeftRight,
  UserRound,
  QrCode,
  Send,
  Wallet,
  CreditCard,
  Bell,
  Lock,
  ChartNoAxesColumn,
  Settings,
  CircleHelp,
  Calendar,
  Receipt,
  Search,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,

  // Iconos de soporte UI y comercio
  Store,
  Clock,
  Eye,
  EyeOff,
  X,
  Trash2,
  Camera,
  Image: ImageIcon,
  EllipsisVertical,
  Minus,
  CircleCheck,
  CircleAlert,
  ShieldCheck,
  Utensils,
  Coffee,
  ShoppingBasket,
  Tag,
  Droplets,
  Cookie,
  CupSoda,
  Building2,
  Banknote,
  Phone,
  Mail,

  // Aliases kebab-case para uso uniforme y compatibilidad con datos existentes
  home: Home,
  'home-outline': Home,
  'arrow-left-right': ArrowLeftRight,
  'user-round': UserRound,
  person: UserRound,
  'person-outline': UserRound,
  'qr-code': QrCode,
  'qr-code-outline': QrCode,
  send: Send,
  wallet: Wallet,
  'wallet-outline': Wallet,
  'credit-card': CreditCard,
  bell: Bell,
  'notifications-outline': Bell,
  lock: Lock,
  'lock-closed-outline': Lock,
  'chart-no-axes-column': ChartNoAxesColumn,
  'bar-chart': ChartNoAxesColumn,
  'bar-chart-outline': ChartNoAxesColumn,
  'stats-chart': ChartNoAxesColumn,
  settings: Settings,
  'circle-help': CircleHelp,
  calendar: Calendar,
  'calendar-outline': Calendar,
  receipt: Receipt,
  'receipt-outline': Receipt,
  search: Search,
  'search-outline': Search,
  plus: Plus,
  add: Plus,
  check: Check,
  checkmark: Check,
  'chevron-right': ChevronRight,
  'chevron-forward': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-back': ChevronLeft,
  'chevron-down': ChevronDown,
  'arrow-down-left': ArrowDownLeft,
  'arrow-up-right': ArrowUpRight,
  store: Store,
  storefront: Store,
  'storefront-outline': Store,
  clock: Clock,
  time: Clock,
  'time-outline': Clock,
  eye: Eye,
  'eye-outline': Eye,
  'eye-off': EyeOff,
  'eye-off-outline': EyeOff,
  close: X,
  'close-circle': X,
  'trash-outline': Trash2,
  'trash-2': Trash2,
  'camera-outline': Camera,
  'ellipsis-vertical': EllipsisVertical,
  remove: Minus,
  minus: Minus,
  'checkmark-circle': CircleCheck,
  'circle-check': CircleCheck,
  'alert-circle-outline': CircleAlert,
  'circle-alert': CircleAlert,
  'shield-checkmark-outline': ShieldCheck,
  'shield-check': ShieldCheck,
  'cash-outline': Banknote,
  banknote: Banknote,
  'business-outline': Building2,
  'call-outline': Phone,
  'mail-outline': Mail,
  'water-outline': Droplets,
  'cafe-outline': Coffee,
  coffee: Coffee,
  'restaurant-outline': Utensils,
  'fast-food-outline': Utensils,
  utensils: Utensils,
  'nutrition-outline': CupSoda,
  'ice-cream-outline': Cookie,
  cookie: Cookie,
  'cube-outline': ShoppingBasket,
  'basket-outline': ShoppingBasket,
  'shopping-basket': ShoppingBasket,
  'pricetag-outline': Tag,
  tag: Tag,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof LUCIDE_ICON_MAP;

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppIcon({ name, size = 20, color, strokeWidth, style, testID }: AppIconProps) {
  const { tokens } = useAppTheme();
  const IconComponent = LUCIDE_ICON_MAP[name] ?? CircleHelp;

  const iconElement = (
    <IconComponent
      size={size}
      color={color ?? tokens.colors.textPrimary}
      strokeWidth={strokeWidth ?? tokens.icons.strokeWidth}
      style={testID ? undefined : style}
    />
  );

  if (testID) {
    return (
      <View testID={testID} style={style}>
        {iconElement}
      </View>
    );
  }

  return iconElement;
}
