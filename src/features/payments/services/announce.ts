import { Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { amountToSpanishWords } from '../utils/amountToSpanishWords';

const SHIFT_KEEP_AWAKE_TAG = 'nemipay-shift';

function canSpeak(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
  return true;
}

function speakSpanish(phrase: string): void {
  if (!canSpeak()) {
    return;
  }

  try {
    Speech.speak(phrase, {
      language: 'es-MX',
      rate: 0.98,
      pitch: 1.0,
    });
  } catch {
    // Degradación silenciosa a solo visual si falla la síntesis de voz
  }
}

export async function startShiftAnnouncement(): Promise<void> {
  speakSpanish('Turno iniciado');
  try {
    await activateKeepAwakeAsync(SHIFT_KEEP_AWAKE_TAG);
  } catch {
    // Algunos navegadores bloquean Wake Lock sin HTTPS o sin soporte; no interrumpe el turno
  }
}

export function stopShiftKeepAwake(): void {
  try {
    void deactivateKeepAwake(SHIFT_KEEP_AWAKE_TAG);
  } catch {
    // No-op seguro
  }
}

export function announcePaymentReceived(amountCents: number): string {
  const words = amountToSpanishWords(amountCents);
  const phrase = `Pago recibido, ${words}`;
  speakSpanish(phrase);
  return phrase;
}
