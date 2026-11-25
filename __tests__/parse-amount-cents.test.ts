import {
  applyKeypadKey,
  parseAmountInputToCents,
} from '@/features/payments/utils/parseAmountCents';

describe('parseAmountInputToCents y applyKeypadKey', () => {
  it('convierte strings decimales a centavos enteros sin errores de punto flotante', () => {
    expect(parseAmountInputToCents('')).toBe(0);
    expect(parseAmountInputToCents('1')).toBe(100);
    expect(parseAmountInputToCents('19.99')).toBe(1999);
    expect(parseAmountInputToCents('80.5')).toBe(8050);
    expect(parseAmountInputToCents('80.50')).toBe(8050);
    expect(parseAmountInputToCents('.25')).toBe(25);
    expect(parseAmountInputToCents('99999')).toBe(9_999_900);
    expect(parseAmountInputToCents('100000')).toBe(0);
  });

  it('aplica teclas del teclado respetando 2 decimales y el tope máximo', () => {
    let value = '';
    for (const key of ['8', '0', '.', '5', '0']) {
      value = applyKeypadKey(value, key);
    }
    expect(value).toBe('80.50');

    // No permite un tercer decimal
    expect(applyKeypadKey(value, '9')).toBe('80.50');

    // No permite segundo punto
    expect(applyKeypadKey(value, '.')).toBe('80.50');

    // Borrado y punto inicial
    expect(applyKeypadKey('', '.')).toBe('0.');
    expect(applyKeypadKey('80.5', 'backspace')).toBe('80.');
  });
});
