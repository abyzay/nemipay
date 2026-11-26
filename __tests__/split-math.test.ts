import {
  computeCustomRemainingCents,
  computeEqualShares,
  getMaxEqualPeopleForTotal,
  validateCustomShares,
} from '@/features/bills/utils/splitMath';

describe('splitMath (reparto en centavos enteros)', () => {
  it('reparte 10000 entre 3 como 3334, 3333, 3333', () => {
    const shares = computeEqualShares(10000, 3);
    expect(shares.map((s) => s.shareCents)).toEqual([3334, 3333, 3333]);
    expect(shares.reduce((acc, s) => acc + s.shareCents, 0)).toBe(10000);
  });

  it('reparte 20000 entre 4 como 4 × 5000', () => {
    const shares = computeEqualShares(20000, 4);
    expect(shares.map((s) => s.shareCents)).toEqual([5000, 5000, 5000, 5000]);
  });

  it('rechaza partes menores a 100 centavos, totales menores a 200 centavos y más de 4 personas', () => {
    expect(() => computeEqualShares(250, 3)).toThrow('al menos $1.00');
    expect(() => computeEqualShares(150, 2)).toThrow('al menos $2.00');
    expect(() => computeEqualShares(5000, 1)).toThrow();
    expect(() => computeEqualShares(5000, 5)).toThrow();
    expect(getMaxEqualPeopleForTotal(350)).toBe(3);
    expect(getMaxEqualPeopleForTotal(20000)).toBe(4);
  });

  it('valida modo personalizado con suma exacta, mínimo 100 centavos y etiqueta <= 20', () => {
    expect(computeCustomRemainingCents(1000, [{ amountCents: 400 }, { amountCents: 350 }])).toBe(
      250
    );

    expect(
      validateCustomShares(1000, [
        { label: 'Ana', amountCents: 600 },
        { label: 'Luis', amountCents: 400 },
      ])
    ).toBeNull();

    expect(
      validateCustomShares(1000, [
        { label: 'Ana', amountCents: 500 },
        { label: 'Luis', amountCents: 400 },
      ])
    ).toContain('Falta asignar');

    expect(
      validateCustomShares(1000, [
        { label: 'Ana', amountCents: 950 },
        { label: 'Luis', amountCents: 50 },
      ])
    ).toContain('al menos $1.00');

    expect(
      validateCustomShares(1000, [
        { label: 'NombreDemasiadoLargo123', amountCents: 500 },
        { label: 'Luis', amountCents: 500 },
      ])
    ).toContain('20 caracteres');
  });
});
