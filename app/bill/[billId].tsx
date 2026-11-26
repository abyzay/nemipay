import { router, useLocalSearchParams } from 'expo-router';
import { BillScreen } from '@/features/bills';

export default function BillRoute() {
  const { billId } = useLocalSearchParams<{ billId?: string | string[] }>();
  const resolvedBillId = Array.isArray(billId) ? billId[0] : billId;

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (!resolvedBillId) {
    return null;
  }

  return <BillScreen billId={resolvedBillId} onBackPress={handleBackPress} />;
}
