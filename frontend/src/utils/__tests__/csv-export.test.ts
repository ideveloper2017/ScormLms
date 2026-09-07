import { expect, it } from 'vitest';
import { buildCsv } from '../csv-export';

it('exports Unicode, quotes and line breaks, preserves zero and neutralizes formulas', () => {
  const csv = buildCsv(['Talaba', 'Ball'], [['O‘quvchi "Ali"\nVali', 0], [' =1+1', null]]);
  expect(csv).toBe('\uFEFF"Talaba","Ball"\r\n"O‘quvchi ""Ali""\nVali","0"\r\n"\' =1+1",""');
});
