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

export async function keepScreenAwake(): Promise<void> {
  try {
    await activateKeepAwakeAsync(SHIFT_KEEP_AWAKE_TAG);
  } catch {
    // Algunos navegadores bloquean Wake Lock sin HTTPS o sin soporte; no interrumpe el turno
  }
}

export async function startShiftAnnouncement(): Promise<void> {
  speakSpanish('Turno iniciado');
  await keepScreenAwake();
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

export function announcePartialBillPayment(paidCents: number, remainingCents: number): string {
  const paidWords = amountToSpanishWords(paidCents);
  const remainingWords = amountToSpanishWords(Math.max(0, remainingCents));
  const phrase = `Pago recibido, ${paidWords}. Faltan ${remainingWords}.`;
  speakSpanish(phrase);
  return phrase;
}

export function announceBillSettled(totalCents: number): string {
  const totalWords = amountToSpanishWords(totalCents);
  const phrase = `Cuenta liquidada, ${totalWords}.`;
  speakSpanish(phrase);
  return phrase;
}

export function announceBillOverpaid(overpaidCents: number): string {
  const words = amountToSpanishWords(overpaidCents);
  const phrase = `Atención, sobrepago de ${words}.`;
  speakSpanish(phrase);
  return phrase;
}
