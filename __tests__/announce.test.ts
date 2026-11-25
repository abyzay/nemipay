import * as KeepAwake from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import {
  announcePaymentReceived,
  startShiftAnnouncement,
  stopShiftKeepAwake,
} from '@/features/payments/services/announce';
import { useUiStore } from '@/stores';

describe('Anuncio hablado, keep-awake y deduplicación por chargeId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({ announcedChargeIds: {}, shiftActive: false });
  });

  it('pronuncia el pago recibido en español mexicano', () => {
    const phrase = announcePaymentReceived(8000);
    expect(phrase).toBe('Pago recibido, ochenta pesos');
    expect(Speech.speak).toHaveBeenCalledWith(
      'Pago recibido, ochenta pesos',
      expect.objectContaining({ language: 'es-MX' })
    );
  });

  it('inicia y detiene el turno con locución de prueba y keep-awake', async () => {
    await startShiftAnnouncement();
    expect(Speech.speak).toHaveBeenCalledWith(
      'Turno iniciado',
      expect.objectContaining({ language: 'es-MX' })
    );
    expect(KeepAwake.activateKeepAwakeAsync).toHaveBeenCalledTimes(1);

    stopShiftKeepAwake();
    expect(KeepAwake.deactivateKeepAwake).toHaveBeenCalledTimes(1);
  });

  it('registra cada chargeId anunciado una sola vez en el store UI', () => {
    const store = useUiStore.getState();
    expect(store.hasAnnouncedCharge('charge-1')).toBe(false);

    store.markChargeAnnounced('charge-1');
    expect(useUiStore.getState().hasAnnouncedCharge('charge-1')).toBe(true);
    expect(useUiStore.getState().hasAnnouncedCharge('charge-2')).toBe(false);
  });
});
