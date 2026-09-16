import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campus } from '../../types';
import { FeatureTags, downloadCsv } from '../../components/common/FeatureTags';
import { PrintPortal } from '../../components/common/PrintPortal';
import { code128BModules, isCode128BEncodable } from '../../lib/code128';
import {
  CARD_HOLDERS,
  INITIAL_CARD_RECORDS,
  ID_CARD_AS_OF,
  STUDENT_CARD_VALID_UNTIL,
  STAFF_CARD_VALIDITY_YEARS,
  STAFF_CATEGORY_COLOURS,
  CardHolder,
  CardRecord,
  CardState,
  HolderType,
  activeCardFor,
  addYears,
  cardStateFor,
  isValidRfid,
  nextCardNumber,
} from '../../data/idCards';

// ---------------------------------------------------------------------------
// Template model
// ---------------------------------------------------------------------------

interface CardTemplate {
  orientation: 'portrait' | 'landscape';
  accent: string;
  showBloodGroup: boolean;
  showEmergency: boolean;
  showAccessZones: boolean;
  signatory: string;
  backNote: string;
}

const ACCENTS = ['#0e5d84', '#082b3d', '#7c2d12', '#166534', '#6d28d9'];

export const DEFAULT_TEMPLATES: Record<HolderType, CardTemplate> = {
  Student: {
    orientation: 'portrait',
    accent: '#0e5d84',
    showBloodGroup: true,
    showEmergency: true,
    showAccessZones: false,
    signatory: 'Principal',
    backNote: 'If found, please return to the school office. This card is the property of the school and must be carried at all times on campus.',
  },
  Teacher: {
    orientation: 'portrait',
    accent: '#082b3d',
    showBloodGroup: true,
    showEmergency: true,
    showAccessZones: true,
    signatory: 'Principal',
    backNote: 'Faculty identity card. Valid for campus, library and turnstile access within the zones listed.',
  },
  Staff: {
    orientation: 'landscape',
    accent: '#082b3d',
    showBloodGroup: true,
    showEmergency: true,
    showAccessZones: true,
    signatory: 'Estate Officer',
    backNote: 'Colour band shows staff category. Access is limited to the zones listed. Report loss to Security immediately.',
  },
};

const REISSUE_REASONS = ['Lost', 'Damaged', 'Data correction', 'Photo update'];

const STATE_STYLE: Record<CardState, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Not issued': 'bg-slate-100 text-slate-600 border-slate-200',
  Expired: 'bg-amber-50 text-amber-700 border-amber-200',
  'Photo missing': 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const initialsOf = (name: string) =>
  name
    .replace(/^(Mr|Mrs|Ms|Dr|Coach)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// ---------------------------------------------------------------------------
// Card rendering (CR80: 85.6 × 54 mm)
// ---------------------------------------------------------------------------

const Barcode: React.FC<{ value: string; height?: number }> = ({ value, height = 28 }) => {
  if (!isCode128BEncodable(value)) return null;
  const { widths, total } = code128BModules(value);
  const quiet = 10;
  let x = quiet;
  const bars: { x: number; w: number }[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  });
  return (
    <svg viewBox={`0 0 ${total + quiet * 2} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height: `${height / 4}mm` }} role="img" aria-label={`Barcode ${value}`}>
      <rect x={0} y={0} width={total + quiet * 2} height={height} fill="#fff" />
      {bars.map(b => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={height} fill="#000" />
      ))}
    </svg>
  );
};

interface CardProps {
  holder: CardHolder;
  card?: CardRecord;
  template: CardTemplate;
  campus: Campus;
  side: 'front' | 'back';
}

export const IdCard: React.FC<CardProps> = ({ holder, card, template, campus, side }) => {
  const portrait = template.orientation === 'portrait';
  const size = portrait ? { width: '54mm', height: '85.6mm' } : { width: '85.6mm', height: '54mm' };
  const band = holder.staffCategory ? STAFF_CATEGORY_COLOURS[holder.staffCategory] : template.accent;
  const cardNo = card?.cardNo ?? 'PREVIEW-0000';
  const title = holder.type === 'Student' ? 'STUDENT IDENTITY CARD' : holder.type === 'Teacher' ? 'FACULTY IDENTITY CARD' : 'STAFF IDENTITY CARD';

  const photo = (
    <div className="shrink-0 overflow-hidden rounded-md border-2 bg-slate-100 flex items-center justify-center" style={{ borderColor: band, width: '20mm', height: '25mm' }}>
      {holder.photo ? (
        <img src={holder.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="text-[14px] font-bold text-slate-400">{initialsOf(holder.name)}</span>
      )}
    </div>
  );

  if (side === 'back') {
    return (
      <div className="id-card bg-white border border-slate-300 rounded-[3mm] overflow-hidden flex flex-col text-[#082b3d]" style={size}>
        <div className="h-[3mm]" style={{ background: band }} />
        <div className="flex-1 p-[3mm] flex flex-col gap-[1.5mm] text-[7px] leading-snug">
          {template.showEmergency && (
            <p>
              <span className="font-bold">Emergency contact:</span> {holder.emergencyPhone}
            </p>
          )}
          {template.showAccessZones && holder.accessZones && (
            <p>
              <span className="font-bold">Access zones:</span> {holder.accessZones.join(', ')}
            </p>
          )}
          <p className="text-slate-600">{template.backNote}</p>
          <div className="mt-auto space-y-[1mm]">
            <p className="font-bold">{campus.name}</p>
            <p className="text-slate-600">{campus.location}</p>
            <p className="text-slate-600">Affiliation {campus.affiliationNumber}</p>
            <Barcode value={cardNo} />
            <p className="text-center font-mono text-[7px] tracking-wider">{cardNo}</p>
          </div>
        </div>
      </div>
    );
  }

  const details = (
    <div className="min-w-0 text-[7px] leading-tight space-y-[0.8mm]">
      <p className="font-extrabold text-[10px] leading-tight break-words">{holder.name}</p>
      <p className="font-semibold" style={{ color: band }}>
        {holder.designation}
      </p>
      <p>
        <span className="text-slate-500">{holder.type === 'Student' ? 'Adm. No' : 'Emp. Code'}:</span> <span className="font-mono font-bold">{holder.identifier}</span>
      </p>
      {template.showBloodGroup && (
        <p>
          <span className="text-slate-500">Blood group:</span> <span className="font-bold text-rose-700">{holder.bloodGroup}</span>
        </p>
      )}
      {card && (
        <p>
          <span className="text-slate-500">Valid till:</span> <span className="font-bold">{formatDate(card.validUntil)}</span>
        </p>
      )}
      {card && card.version > 1 && <p className="text-slate-500">Duplicate · v{card.version}</p>}
    </div>
  );

  return (
    <div className="id-card bg-white border border-slate-300 rounded-[3mm] overflow-hidden flex flex-col text-[#082b3d]" style={size}>
      <div className="px-[2.5mm] py-[1.5mm] flex items-center gap-[1.5mm] text-white" style={{ background: template.accent }}>
        <img src="/lumen-academy-logo.png" alt="" className="w-[7mm] h-[7mm] object-contain bg-white rounded-full p-[0.3mm]" />
        <div className="min-w-0 leading-tight">
          <p className="text-[8px] font-extrabold tracking-wide">LUMEN ACADEMY</p>
          <p className="text-[6px] opacity-90 truncate">{campus.name}</p>
        </div>
      </div>
      <div className="text-center text-[6px] font-bold tracking-[0.15em] py-[0.8mm] text-white" style={{ background: band }}>
        {holder.staffCategory ? `${title} · ${holder.staffCategory.toUpperCase()}` : title}
      </div>
      {portrait ? (
        <div className="flex-1 flex flex-col items-center gap-[1.5mm] p-[2.5mm] text-center">
          {photo}
          {details}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex gap-[2.5mm] px-[2.5mm] py-[1.5mm]">
          {photo}
          {details}
        </div>
      )}
      {portrait ? (
        <div className="px-[2.5mm] pb-[1.5mm] space-y-[1mm]">
          <div className="ml-auto w-[16mm] text-center">
            <div className="border-b border-slate-400 h-[3mm]" />
            <p className="text-[5.5px] text-slate-500">{template.signatory}</p>
          </div>
          <Barcode value={cardNo} height={20} />
        </div>
      ) : (
        <div className="px-[2.5mm] pb-[1.5mm] flex items-end gap-[3mm]">
          <div className="flex-1 min-w-0">
            <Barcode value={cardNo} height={20} />
          </div>
          <div className="w-[16mm] shrink-0 text-center">
            <div className="border-b border-slate-400 h-[3mm]" />
            <p className="text-[5.5px] text-slate-500">{template.signatory}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Print sheet: A4, fronts then backs, rows mirrored for long-edge duplex
// ---------------------------------------------------------------------------

export const PrintSheet: React.FC<{ jobs: { holder: CardHolder; card: CardRecord }[]; templates: Record<HolderType, CardTemplate>; campus: Campus }> = ({ jobs, templates, campus }) => {
  const perRow = (t: CardTemplate) => (t.orientation === 'portrait' ? 3 : 2);
  const pages: { side: 'front' | 'back'; rows: (typeof jobs)[] }[] = [];
  (['Student', 'Teacher', 'Staff'] as HolderType[]).forEach(type => {
    const group = jobs.filter(j => j.holder.type === type);
    if (!group.length) return;
    const t = templates[type];
    const cols = perRow(t);
    const rowsPerPage = t.orientation === 'portrait' ? 3 : 5;
    const rows: (typeof jobs)[] = [];
    for (let i = 0; i < group.length; i += cols) rows.push(group.slice(i, i + cols));
    for (let p = 0; p < rows.length; p += rowsPerPage) {
      const pageRows = rows.slice(p, p + rowsPerPage);
      pages.push({ side: 'front', rows: pageRows });
      pages.push({ side: 'back', rows: pageRows.map(r => [...r].reverse()) });
    }
  });
  return (
    <div>
      {pages.map((page, pi) => (
        <div key={pi} className="id-print-page">
          {page.rows.map((row, ri) => (
            <div key={ri} className={`id-print-row ${page.side === 'back' ? 'justify-end' : ''}`}>
              {row.map(j => (
                <IdCard key={`${page.side}-${j.card.cardNo}`} holder={j.holder} card={j.card} template={templates[j.holder.type]} campus={campus} side={page.side} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bulk import validation (MIG-017)
// ---------------------------------------------------------------------------

interface ImportRow {
  line: number;
  identifier: string;
  cardNo: string;
  rfid: string;
  holder?: CardHolder;
  errors: string[];
}

export const validateCardImport = (text: string, holders: CardHolder[], records: CardRecord[]): ImportRow[] => {
  const lines = text.trim().split(/\r?\n/);
  const seenCards = new Set<string>();
  const seenRfids = new Set<string>();
  return lines.slice(1).map((line, idx) => {
    const [identifier = '', cardNoRaw = '', rfidRaw = ''] = line.split(',').map(c => c.trim());
    const cardNo = cardNoRaw.toUpperCase();
    const rfid = rfidRaw.toUpperCase();
    const holder = holders.find(h => h.identifier.toUpperCase() === identifier.toUpperCase());
    const errors: string[] = [];
    if (!holder) errors.push(`No student or staff member with ID ${identifier || '(blank)'}`);
    if (!/^[A-Z0-9-]{6,32}$/.test(cardNo)) errors.push('Card number must be 6–32 letters, digits or hyphens');
    else if (records.some(r => r.cardNo === cardNo && r.holderId !== holder?.id)) errors.push(`Card number ${cardNo} is already assigned to someone else`);
    else if (seenCards.has(cardNo)) errors.push(`Card number ${cardNo} appears twice in this file`);
    if (rfid) {
      if (!isValidRfid(rfid)) errors.push('RFID must be 8, 10 or 14 hex characters');
      else if (records.some(r => r.status === 'Active' && r.rfid === rfid && r.holderId !== holder?.id)) errors.push(`RFID ${rfid} is already on another active card`);
      else if (seenRfids.has(rfid)) errors.push(`RFID ${rfid} appears twice in this file`);
    }
    if (holder && !holder.photo) errors.push('No photo on file — upload photos before importing this card');
    seenCards.add(cardNo);
    if (rfid) seenRfids.add(rfid);
    return { line: idx + 2, identifier, cardNo, rfid, holder, errors };
  });
};

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

type Tab = 'issue' | 'designer' | 'import' | 'register';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'issue', label: 'Issue & Print', icon: 'print', ids: ['STU-016', 'TCH-009', 'NTS-010', 'MST-010'] },
  { id: 'designer', label: 'Card Designer', icon: 'design_services', ids: ['STU-016', 'TEN-011', 'STU-004', 'NTS-010'] },
  { id: 'import', label: 'Bulk Import', icon: 'upload_file', ids: ['MIG-017'] },
  { id: 'register', label: 'Card Register', icon: 'receipt_long', ids: ['STU-016', 'AUD-003'] },
];

const SAMPLE_IMPORT = `identifier,card_number,rfid
ADM-2018-0483,LEGACY-2019-0331,04B7C8D9
ADM-2018-0485,LEGACY-2019-0335,04B7C8DA
EMP-T-0131,LEGACY-FAC-0131,08F0E1AA
EMP-N-0063,LEGACY-2019-0331,0C11223355
ADM-2018-0489,LEGACY-2019-0339,04B7C8DB
EMP-X-9999,LEGACY-2019-0400,XYZ`;

export const IdCardStudioView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'issue' }) => {
  const { addToast, selectedCampus, currentUser } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [records, setRecords] = useState<CardRecord[]>(INITIAL_CARD_RECORDS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [designType, setDesignType] = useState<HolderType>('Student');
  const [previewHolderId, setPreviewHolderId] = useState('stu-01');
  const [typeFilter, setTypeFilter] = useState<'All' | HolderType>('All');
  const [stateFilter, setStateFilter] = useState<'All' | CardState>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reissueFor, setReissueFor] = useState<CardHolder | null>(null);
  const [reissueReason, setReissueReason] = useState(REISSUE_REASONS[0]);
  const [importText, setImportText] = useState(SAMPLE_IMPORT);
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
  const [printJob, setPrintJob] = useState<{ holder: CardHolder; card: CardRecord }[] | null>(null);
  const [printLog, setPrintLog] = useState<{ at: string; count: number; by: string }[]>([]);

  const issueDate = ID_CARD_AS_OF;

  const rows = useMemo(
    () =>
      CARD_HOLDERS.map(h => ({ holder: h, state: cardStateFor(h, records), card: activeCardFor(records, h.id) })).filter(r => {
        if (typeFilter !== 'All' && r.holder.type !== typeFilter) return false;
        if (stateFilter !== 'All' && r.state !== stateFilter) return false;
        const q = search.trim().toLowerCase();
        if (q && !`${r.holder.name} ${r.holder.identifier} ${r.card?.cardNo ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [records, typeFilter, stateFilter, search]
  );

  const counts = useMemo(() => {
    const c: Record<CardState, number> = { Active: 0, 'Not issued': 0, Expired: 0, 'Photo missing': 0 };
    CARD_HOLDERS.forEach(h => c[cardStateFor(h, records)]++);
    return c;
  }, [records]);

  const validityFor = (holder: CardHolder) => (holder.type === 'Student' ? STUDENT_CARD_VALID_UNTIL : addYears(issueDate, STAFF_CARD_VALIDITY_YEARS));

  const issueCards = (holders: CardHolder[], reasonForExisting: string, blockOldRfid = false) => {
    let next = [...records];
    const issued: string[] = [];
    holders.forEach(h => {
      const current = activeCardFor(next, h.id);
      if (current) next = next.map(r => (r.cardNo === current.cardNo ? { ...r, status: 'Revoked' as const, revokeReason: reasonForExisting } : r));
      const cardNo = nextCardNumber(next, selectedCampus.code, h.type, issueDate);
      next.push({
        cardNo,
        holderId: h.id,
        rfid: blockOldRfid ? undefined : current?.rfid,
        issuedOn: issueDate,
        validUntil: validityFor(h),
        version: (current?.version ?? next.filter(r => r.holderId === h.id).length) + 1,
        status: 'Active',
      });
      issued.push(cardNo);
    });
    setRecords(next);
    return issued;
  };

  const generateSelected = () => {
    const chosen = CARD_HOLDERS.filter(h => selected.has(h.id));
    const eligible = chosen.filter(h => ['Not issued', 'Expired'].includes(cardStateFor(h, records)));
    const blocked = chosen.filter(h => cardStateFor(h, records) === 'Photo missing').length;
    const alreadyActive = chosen.filter(h => cardStateFor(h, records) === 'Active').length;
    if (!eligible.length) {
      addToast('No cards to generate', 'warning', `${alreadyActive} already active · ${blocked} missing a photo`);
      return;
    }
    const issued = issueCards(eligible, 'Expired — renewed');
    addToast(`Generated ${issued.length} card(s)`, 'success', `${alreadyActive} already active · ${blocked} blocked for missing photo`);
  };

  const printSelected = () => {
    const jobs = CARD_HOLDERS.filter(h => selected.has(h.id))
      .map(h => ({ holder: h, card: activeCardFor(records, h.id), state: cardStateFor(h, records) }))
      .filter((j): j is { holder: CardHolder; card: CardRecord; state: CardState } => j.state === 'Active' && Boolean(j.card));
    const skipped = selected.size - jobs.length;
    if (!jobs.length) {
      addToast('Nothing printable in the selection', 'warning', 'Only active, unexpired cards with a photo can be printed');
      return;
    }
    setPrintLog(prev => [{ at: new Date().toLocaleString('en-IN'), count: jobs.length, by: currentUser.name }, ...prev]);
    setPrintJob(jobs.map(({ holder, card }) => ({ holder, card })));
    addToast(`Sending ${jobs.length} card(s) to the printer`, 'info', skipped ? `${skipped} skipped (not issued, expired or no photo)` : 'A4 sheet · fronts then mirrored backs for duplex');
  };

  const confirmReissue = () => {
    if (!reissueFor) return;
    const [cardNo] = issueCards([reissueFor], reissueReason, reissueReason === 'Lost');
    addToast(`Reissued ${cardNo} to ${reissueFor.name}`, 'success', reissueReason === 'Lost' ? 'Old card and its RFID blocked' : `Previous card revoked: ${reissueReason}`);
    setReissueFor(null);
  };

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = rows.length > 0 && rows.every(r => selected.has(r.holder.id));
  const toggleAllVisible = () =>
    setSelected(prev => {
      const next = new Set(prev);
      rows.forEach(r => (allVisibleSelected ? next.delete(r.holder.id) : next.add(r.holder.id)));
      return next;
    });

  const validateImport = () => {
    const result = validateCardImport(importText, CARD_HOLDERS, records);
    setImportRows(result);
    const bad = result.filter(r => r.errors.length).length;
    addToast(`Validated ${result.length} rows`, bad ? 'warning' : 'success', `${result.length - bad} ready · ${bad} with errors`);
  };

  const commitImport = () => {
    if (!importRows) return;
    const good = importRows.filter(r => !r.errors.length && r.holder);
    if (!good.length) {
      addToast('No valid rows to import', 'warning');
      return;
    }
    let next = [...records];
    good.forEach(r => {
      const holder = r.holder!;
      const current = activeCardFor(next, holder.id);
      if (current) next = next.map(c => (c.cardNo === current.cardNo ? { ...c, status: 'Revoked' as const, revokeReason: 'Replaced by legacy card import' } : c));
      next.push({
        cardNo: r.cardNo,
        holderId: holder.id,
        rfid: r.rfid || undefined,
        issuedOn: issueDate,
        validUntil: validityFor(holder),
        version: next.filter(c => c.holderId === holder.id).length + 1,
        status: 'Active',
      });
    });
    setRecords(next);
    setSelected(new Set(good.map(r => r.holder!.id)));
    setImportRows(null);
    setTab('issue');
    setTypeFilter('All');
    setStateFilter('All');
    addToast(`Imported ${good.length} card mapping(s)`, 'success', 'Imported holders are selected and ready to print');
  };

  const exportRegister = () => {
    downloadCsv(
      `ID_Card_Register_${selectedCampus.code}_${ID_CARD_AS_OF}.csv`,
      ['Card number', 'Holder', 'Type', 'ID', 'RFID', 'Issued', 'Valid until', 'Version', 'Status', 'Revoke reason'],
      records.map(r => {
        const h = CARD_HOLDERS.find(x => x.id === r.holderId)!;
        return [r.cardNo, h.name, h.type, h.identifier, r.rfid ?? '', r.issuedOn, r.validUntil, r.version, r.status, r.revokeReason ?? ''];
      })
    );
    addToast(`Exported ${records.length} card records`, 'success', 'Export event logged — AUD-003');
  };

  const template = templates[designType];
  const setTemplate = (patch: Partial<CardTemplate>) => setTemplates(prev => ({ ...prev, [designType]: { ...prev[designType], ...patch } }));
  const designHolders = CARD_HOLDERS.filter(h => h.type === designType);
  const previewHolder = designHolders.find(h => h.id === previewHolderId) ?? designHolders[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Identity · Students, faculty & support staff</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">ID Card Studio</h1>
          <p className="text-xs text-[#464555] mt-1">
            {selectedCampus.name} · CR80 cards (85.6 × 54 mm) · status as of {formatDate(ID_CARD_AS_OF)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(counts) as CardState[]).map(state => (
          <button
            key={state}
            onClick={() => {
              setTab('issue');
              setStateFilter(stateFilter === state ? 'All' : state);
            }}
            className={`text-left bg-white rounded-2xl border p-4 shadow-xs ${stateFilter === state ? 'border-[#0e5d84] ring-2 ring-[#0e5d84]/20' : 'border-[#e0ecf4]'}`}
          >
            <p className="text-2xl font-bold text-[#082b3d]">{counts[state]}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATE_STYLE[state]}`}>{state}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e0ecf4]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-[#0e5d84] text-[#0e5d84]' : 'border-transparent text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {tab === 'issue' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID or card number"
              className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 w-full sm:w-56"
            />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'All' | HolderType)} className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white">
              {['All', 'Student', 'Teacher', 'Staff'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value as 'All' | CardState)} className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white">
              {['All', 'Active', 'Not issued', 'Expired', 'Photo missing'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="flex-1" />
            <button onClick={generateSelected} disabled={!selected.size} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
              Generate cards ({selected.size})
            </button>
            <button onClick={printSelected} disabled={!selected.size} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">print</span>
              Print selected
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  <th className="p-3 w-8">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="accent-[#0e5d84]" aria-label="Select all shown" />
                  </th>
                  {['Holder', 'Type', 'ID', 'Card number', 'RFID', 'Valid until', 'Status', ''].map(h => (
                    <th key={h} className="text-left p-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {rows.map(({ holder, state, card }) => (
                  <tr key={holder.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(holder.id)} onChange={() => toggle(holder.id)} className="accent-[#0e5d84]" aria-label={`Select ${holder.name}`} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {holder.photo ? (
                          <img src={holder.photo} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold flex items-center justify-center">{initialsOf(holder.name)}</span>
                        )}
                        <div>
                          <p className="font-semibold text-[#082b3d]">{holder.name}</p>
                          <p className="text-[10px] text-[#777587]">{holder.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {holder.type}
                      {holder.staffCategory && (
                        <span className="ml-1 inline-block w-2 h-2 rounded-full align-middle" style={{ background: STAFF_CATEGORY_COLOURS[holder.staffCategory] }} title={holder.staffCategory} />
                      )}
                    </td>
                    <td className="p-3 font-mono">{holder.identifier}</td>
                    <td className="p-3 font-mono">{card?.cardNo ?? '—'}</td>
                    <td className="p-3 font-mono">{card?.rfid ?? '—'}</td>
                    <td className="p-3 font-mono">{card ? formatDate(card.validUntil) : '—'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATE_STYLE[state]}`}>{state}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setDesignType(holder.type);
                          setPreviewHolderId(holder.id);
                          setTab('designer');
                        }}
                        className="text-[11px] font-semibold text-[#0e5d84] hover:underline mr-2"
                      >
                        Preview
                      </button>
                      {card && holder.photo && (
                        <button onClick={() => setReissueFor(holder)} className="text-[11px] font-semibold text-amber-700 hover:underline">
                          Reissue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-6 text-center text-xs text-[#777587]">No holders match these filters.</p>}
          </div>
          {printLog.length > 0 && (
            <div className="p-3 border-t border-[#f0f7fb] text-[11px] text-[#464555] space-y-0.5">
              {printLog.map((p, i) => (
                <p key={i}>
                  Print batch · {p.at} · {p.count} card(s) · {p.by}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-4 text-xs">
            <div className="flex gap-1">
              {(['Student', 'Teacher', 'Staff'] as HolderType[]).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setDesignType(t);
                    setPreviewHolderId(CARD_HOLDERS.find(h => h.type === t)!.id);
                  }}
                  className={`flex-1 font-semibold px-2 py-1.5 rounded-lg ${designType === t ? 'bg-[#0e5d84] text-white' : 'bg-slate-100 text-[#082b3d]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Preview with</span>
              <select value={previewHolder.id} onChange={e => setPreviewHolderId(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5">
                {designHolders.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="block font-semibold text-[#464555] mb-1">Orientation</span>
              <div className="flex gap-1">
                {(['portrait', 'landscape'] as const).map(o => (
                  <button key={o} onClick={() => setTemplate({ orientation: o })} className={`flex-1 capitalize px-2 py-1.5 rounded-lg font-semibold ${template.orientation === o ? 'bg-[#082b3d] text-white' : 'bg-slate-100'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block font-semibold text-[#464555] mb-1">Header colour</span>
              <div className="flex gap-2">
                {ACCENTS.map(c => (
                  <button
                    key={c}
                    onClick={() => setTemplate({ accent: c })}
                    className={`w-7 h-7 rounded-full border-2 ${template.accent === c ? 'border-amber-400 scale-110' : 'border-white'}`}
                    style={{ background: c }}
                    aria-label={`Header colour ${c}`}
                  />
                ))}
              </div>
              {designType === 'Staff' && <p className="text-[10px] text-[#777587] mt-1">The category band uses a fixed colour per staff category.</p>}
            </div>
            <div className="space-y-1.5">
              {([
                ['showBloodGroup', 'Blood group'],
                ['showEmergency', 'Emergency contact (back)'],
                ['showAccessZones', 'Access zones (back)'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={template[key]} onChange={e => setTemplate({ [key]: e.target.checked })} className="accent-[#0e5d84]" />
                  {label}
                </label>
              ))}
            </div>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Signatory</span>
              <input value={template.signatory} onChange={e => setTemplate({ signatory: e.target.value })} maxLength={24} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Back-side note ({template.backNote.length}/220)</span>
              <textarea value={template.backNote} onChange={e => setTemplate({ backNote: e.target.value.slice(0, 220) })} rows={4} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5" />
            </label>
            <button
              onClick={() => {
                setTemplates(prev => ({ ...prev, [designType]: DEFAULT_TEMPLATES[designType] }));
                addToast(`${designType} template reset`, 'info');
              }}
              className="font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              Reset to default
            </button>
          </div>

          <div className="lg:col-span-3 bg-slate-50 rounded-2xl border border-[#e0ecf4] p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-[#082b3d] self-start">Live preview · front and back</p>
            {!previewHolder.photo && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 self-stretch">
                No photo on file for {previewHolder.name}. This card can be designed but not printed.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              {(['front', 'back'] as const).map(side => (
                <IdCard key={side} holder={previewHolder} card={activeCardFor(records, previewHolder.id)} template={template} campus={selectedCampus} side={side} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3 text-xs">
            <p className="font-bold text-[#082b3d]">Import existing card numbers and RFID tags</p>
            <p className="text-[11px] text-[#464555]">
              Columns: <span className="font-mono">identifier, card_number, rfid</span>. The identifier is the admission number or employee code. Photos come from
              the photo bulk import. Any active card a holder already has is revoked and replaced.
            </p>
            <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportRows(null); }} rows={8} className="w-full font-mono border border-[#cbe0ec] rounded-lg p-2" />
            <div className="flex gap-2">
              <button onClick={validateImport} className="font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
                Validate
              </button>
              <button
                onClick={commitImport}
                disabled={!importRows || importRows.every(r => r.errors.length)}
                className="font-semibold px-3 py-1.5 rounded-lg bg-[#0e5d84] text-white hover:bg-[#083a4f] disabled:opacity-50"
              >
                Import valid rows & send to print
              </button>
            </div>
          </div>
          {importRows && (
            <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[#464555]">
                  <tr>
                    {['Line', 'Identifier', 'Holder', 'Card number', 'RFID', 'Result'].map(h => (
                      <th key={h} className="text-left p-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f7fb]">
                  {importRows.map(r => (
                    <tr key={r.line} className={r.errors.length ? 'bg-rose-50/40' : ''}>
                      <td className="p-3 font-mono">{r.line}</td>
                      <td className="p-3 font-mono">{r.identifier}</td>
                      <td className="p-3">{r.holder?.name ?? '—'}</td>
                      <td className="p-3 font-mono">{r.cardNo}</td>
                      <td className="p-3 font-mono">{r.rfid || '—'}</td>
                      <td className="p-3">
                        {r.errors.length ? (
                          <ul className="text-rose-700 space-y-0.5">
                            {r.errors.map(e => (
                              <li key={e}>✕ {e}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700 font-semibold">✓ Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'register' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
            <span className="text-xs font-bold text-[#082b3d]">Every card ever issued · {records.length} records</span>
            <button onClick={exportRegister} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  {['Card number', 'Holder', 'RFID', 'Issued', 'Valid until', 'Ver.', 'Status'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {[...records]
                  .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || a.cardNo.localeCompare(b.cardNo))
                  .map(r => {
                    const h = CARD_HOLDERS.find(x => x.id === r.holderId)!;
                    const expired = r.status === 'Active' && r.validUntil < ID_CARD_AS_OF;
                    return (
                      <tr key={r.cardNo} className={r.status === 'Revoked' ? 'text-[#777587]' : ''}>
                        <td className={`p-3 font-mono ${r.status === 'Revoked' ? 'line-through' : ''}`}>{r.cardNo}</td>
                        <td className="p-3">
                          {h.name} <span className="text-[10px] text-[#777587]">· {h.type}</span>
                        </td>
                        <td className="p-3 font-mono">{r.rfid ?? '—'}</td>
                        <td className="p-3 font-mono">{formatDate(r.issuedOn)}</td>
                        <td className="p-3 font-mono">{formatDate(r.validUntil)}</td>
                        <td className="p-3 font-mono">{r.version}</td>
                        <td className="p-3">
                          {r.status === 'Revoked' ? (
                            <span className="text-rose-700">Revoked — {r.revokeReason}</span>
                          ) : expired ? (
                            <span className="text-amber-700 font-semibold">Expired</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reissueFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setReissueFor(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#082b3d]">Reissue card · {reissueFor.name}</h3>
            <p className="text-[#464555]">
              Current card {activeCardFor(records, reissueFor.id)?.cardNo} will be revoked and a new number issued from the series.
            </p>
            <label className="block">
              <span className="block font-semibold text-[#464555] mb-1">Reason</span>
              <select value={reissueReason} onChange={e => setReissueReason(e.target.value)} className="w-full border border-[#cbe0ec] rounded-lg px-2 py-1.5">
                {REISSUE_REASONS.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {reissueReason === 'Lost' && <p className="text-amber-700">The old RFID tag is also blocked. Assign a new tag through bulk import.</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setReissueFor(null)} className="font-semibold px-3 py-1.5 rounded-lg bg-slate-100">
                Cancel
              </button>
              <button onClick={confirmReissue} className="font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white">
                Revoke & reissue
              </button>
            </div>
          </div>
        </div>
      )}

      {printJob && (
        <PrintPortal onDone={() => setPrintJob(null)}>
          <PrintSheet jobs={printJob} templates={templates} campus={selectedCampus} />
        </PrintPortal>
      )}
    </div>
  );
};
