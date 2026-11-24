import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import type { CurrencyCode } from '@/types/common';

export type MovementChannel = 'codi_qr' | 'codi_push';
export type MovementStatus = 'confirmed';

export interface ReceivedMovement {
  id: string;
  concept: string;
  payerReference: string;
  amountCents: number;
  currency: CurrencyCode;
  timeLabel: string;
  status: MovementStatus;
  channel: MovementChannel;
  iconName: IoniconsIconName;
}
