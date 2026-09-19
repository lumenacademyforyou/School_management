import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { byteCapacity, encodeQr, qrPath, rsDivisor, rsRemainder } from '../src/lib/qrcode';
import { cardQrPayload } from '../src/data/idCards';

const CARD = cardQrPayload('LA-CHN01-S24-00001', 'ADM-2018-0481', '2025-05-31');

/** Reads the format information around the top-left finder and returns [ecl bits, mask]. */
const readFormat = (m: boolean[][]) => {
  const at = (x: number, y: number) => (m[y][x] ? 1 : 0);
  const bits = [0, 1, 2, 3, 4, 5].map(i => at(8, i)).concat([at(8, 7), at(8, 8), at(7, 8)], [9, 10, 11, 12, 13, 14].map(i => at(14 - i, 8)));
  const value = bits.reduce((acc, b, i) => acc | (b << i), 0) ^ 0x5412;
  return [value >>> 13, (value >>> 10) & 7];
};
/** The second copy, split between the top-right and bottom-left finders. */
const readFormatCopy = (m: boolean[][]) => {
  const n = m.length;
  const at = (x: number, y: number) => (m[y][x] ? 1 : 0);
  const bits = Array.from({ length: 8 }, (_, i) => at(n - 1 - i, 8)).concat(Array.from({ length: 7 }, (_, i) => at(8, n - 7 + i)));
  const value = bits.reduce((acc, b, i) => acc | (b << i), 0) ^ 0x5412;
  return [value >>> 13, (value >>> 10) & 7];
};

describe('QR codes on ID cards', () => {
  test('Reed–Solomon matches the worked example in ISO/IEC 18004 Annex I', () => {
    const data = [0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11];
    assert.deepEqual(rsRemainder(data, rsDivisor(10)), [0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55]);
  });

  test('card payload carries card number, holder ID and expiry', () => {
    assert.equal(CARD, 'LUMEN-ID|LA-CHN01-S24-00001|ADM-2018-0481|2025-05-31');
    assert.equal(cardQrPayload('PREVIEW-0000', 'EMP-T-0112'), 'LUMEN-ID|PREVIEW-0000|EMP-T-0112|-');
  });

  test('a card fits version 4 (33 × 33) at error-correction level M', () => {
    const qr = encodeQr(CARD, 'M');
    assert.equal(qr.version, 4);
    assert.equal(qr.size, 33);
    assert.equal(qr.modules.length, 33);
    assert.ok(qr.modules.every(row => row.length === 33));
  });

  test('finder patterns sit in three corners and the dark module is set', () => {
    const { modules: m, size } = encodeQr(CARD, 'M');
    for (const [x0, y0] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      for (let i = 0; i < 7; i++) {
        assert.ok(m[y0][x0 + i] && m[y0 + 6][x0 + i] && m[y0 + i][x0] && m[y0 + i][x0 + 6], 'finder border');
      }
      assert.ok(m[y0 + 3][x0 + 3], 'finder centre');
      assert.ok(!m[y0 + 1][x0 + 1], 'finder ring');
    }
    assert.ok(m[size - 8][8], 'dark module');
  });

  test('both copies of the format information name level M and the chosen mask', () => {
    for (const text of [CARD, 'A', 'x'.repeat(120)]) {
      const qr = encodeQr(text, 'M');
      assert.deepEqual(readFormat(qr.modules), [0, qr.mask]);
      assert.deepEqual(readFormatCopy(qr.modules), [0, qr.mask]);
    }
  });

  test('version grows with the payload and stops at version 10', () => {
    assert.equal(encodeQr('x'.repeat(byteCapacity(1, 'M')), 'M').version, 1);
    assert.equal(encodeQr('x'.repeat(byteCapacity(1, 'M') + 1), 'M').version, 2);
    assert.equal(encodeQr('x'.repeat(byteCapacity(10, 'M')), 'M').version, 10);
    assert.throws(() => encodeQr('x'.repeat(byteCapacity(10, 'M') + 1), 'M'), /Too long/);
  });

  test('the SVG path draws one square per dark module', () => {
    const qr = encodeQr(CARD, 'M');
    const dark = qr.modules.flat().filter(Boolean).length;
    assert.equal(qrPath(qr).split('M').length - 1, dark);
    assert.ok(qrPath(qr).startsWith('M4 4h1v1h-1z'), 'quiet zone offset of 4 modules');
  });
});
