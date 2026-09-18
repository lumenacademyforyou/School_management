import assert from 'node:assert/strict';
import { describe, test } from './harness';
import { columnName, crc32, sheetName, toXlsx } from '../src/lib/xlsx';
import { fileStem, parseCell, toCsv } from '../src/lib/exporters';
import { canExportView } from '../src/data/staffAccess';

/** Reads a stored (uncompressed) zip into { name: text }. */
const unzip = (buf: Uint8Array) => {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const files: Record<string, string> = {};
  let p = 0;
  while (dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true);
    const crc = dv.getUint32(p + 14, true);
    const size = dv.getUint32(p + 18, true);
    const nameLen = dv.getUint16(p + 26, true);
    const extra = dv.getUint16(p + 28, true);
    const name = new TextDecoder().decode(buf.slice(p + 30, p + 30 + nameLen));
    const data = buf.slice(p + 30 + nameLen + extra, p + 30 + nameLen + extra + size);
    assert.equal(method, 0, `${name} is stored`);
    assert.equal(crc32(data), crc, `${name} checksum`);
    files[name] = new TextDecoder().decode(data);
    p += 30 + nameLen + extra + size;
  }
  assert.equal(dv.getUint32(buf.length - 22, true), 0x06054b50, 'end of central directory');
  assert.equal(dv.getUint16(buf.length - 22 + 10, true), Object.keys(files).length, 'entry count');
  return files;
};

describe('Export', () => {
  test('crc32 matches the standard check value', () => {
    assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  });

  test('xlsx: a valid package with a typed, frozen header sheet', () => {
    const files = unzip(
      toXlsx('Fees: ledger/2024', ['Student', 'Balance', 'Collected', 'Class'], [
        ['Aarav S. Ramanathan', { v: 24500, fmt: 'money' }, { v: 0.812, fmt: 'percent' }, '10-A'],
        ['Kavin & Kavya <twins>', 0, null, 9],
      ])
    );
    assert.deepEqual(Object.keys(files).sort(), ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']);
    const sheet = files['xl/worksheets/sheet1.xml'];
    assert.match(sheet, /<pane ySplit="1"[^>]*state="frozen"/);
    assert.match(sheet, /<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Student<\/t>/);
    assert.match(sheet, /<c r="B2" s="2"><v>24500<\/v><\/c>/, 'money as a number');
    assert.match(sheet, /<c r="C2" s="3"><v>0.812<\/v><\/c>/, 'percent as a number');
    assert.match(sheet, /<c r="D3"><v>9<\/v><\/c>/);
    assert.match(sheet, /Kavin &amp; Kavya &lt;twins&gt;/, 'text is escaped');
    assert.ok(!/r="C3"/.test(sheet), 'empty cells are left out');
    assert.match(files['xl/workbook.xml'], /<sheet name="Fees  ledger 2024"/, 'sheet name cleaned');
  });

  test('column letters and sheet names', () => {
    assert.deepEqual([0, 25, 26, 27, 701, 702].map(columnName), ['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
    assert.equal(sheetName('A'.repeat(40)).length, 31);
    assert.equal(sheetName(''), 'Sheet1');
  });

  test('reading screen cells: rupees, percentages and numbers become numbers', () => {
    assert.deepEqual(parseCell('₹1,23,456'), { v: 123456, fmt: 'money' });
    assert.deepEqual(parseCell('−₹500'), { v: -500, fmt: 'money' });
    assert.deepEqual(parseCell('94.6%'), { v: 0.946, fmt: 'percent' });
    assert.equal(parseCell('2,486'), 2486);
    assert.equal(parseCell('42'), 42);
    assert.equal(parseCell('ADM-2016-0300'), 'ADM-2016-0300');
    assert.equal(parseCell('0042'), '0042', 'leading zeros stay text');
    assert.equal(parseCell('3300 0011 0200 0000'), '3300 0011 0200 0000', 'EMIS numbers stay text');
    assert.equal(parseCell('+91 98401 23456'), '+91 98401 23456', 'phone numbers stay text');
  });

  test('csv starts with the UTF-8 marker and escapes quotes, commas and new lines', () => {
    const csv = toCsv(['Name', 'Note'], [['Ananya "Anu" Iyer', 'Paid, in full'], ['Line\nbreak', { v: 0.5, fmt: 'percent' }]]);
    assert.ok(csv.startsWith('﻿'));
    assert.equal(csv.slice(1), 'Name,Note\r\n"Ananya ""Anu"" Iyer","Paid, in full"\r\n"Line\nbreak",50%');
    assert.equal(fileStem('Fees · Ledger (10-A)', '2024-09-16'), 'fees-ledger-10-a-2024-09-16');
  });

  test('who may export: record owners and export-grant holders; read-only roles may not', () => {
    assert.ok(canExportView('admissions', 'students'), 'admissions owns student records');
    assert.ok(canExportView('accountant', 'fees'), 'accountant owns fees');
    assert.ok(canExportView('auditor', 'fees'), 'auditor holds E on finance');
    assert.ok(canExportView('exam-coordinator', 'question-papers'));
    assert.ok(canExportView('principal', 'dashboard'));
    assert.ok(!canExportView('accountant', 'students'), 'accountant only reads contact and fee fields');
    assert.ok(!canExportView('principal', 'students'), 'principal reads and approves, no export grant on students');
  });
});
