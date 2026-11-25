import { amountToSpanishWords } from '@/features/payments/utils/amountToSpanishWords';

describe('amountToSpanishWords', () => {
  it.each([
    [0, 'cero pesos'],
    [1, 'cero pesos con un centavo'],
    [100, 'un peso'],
    [101, 'un peso con un centavo'],
    [2100, 'veintiún pesos'],
    [3100, 'treinta y un pesos'],
    [8000, 'ochenta pesos'],
    [8050, 'ochenta pesos con cincuenta centavos'],
    [10000, 'cien pesos'],
    [10100, 'ciento un pesos'],
    [100000, 'mil pesos'],
    [150000, 'mil quinientos pesos'],
    [2100000, 'veintiún mil pesos'],
    [9999900, 'noventa y nueve mil novecientos noventa y nueve pesos'],
  ])('convierte %i centavos a "%s"', (cents, expected) => {
    expect(amountToSpanishWords(cents)).toBe(expected);
  });
});
