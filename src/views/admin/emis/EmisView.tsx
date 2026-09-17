import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { FeatureTags, downloadCsv } from '../../../components/common/FeatureTags';
import { EmptyState, ErrorState, Icon, LoadingRows, Modal, PageHeader, Panel, StatCard, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { EditIdentifiersModal, EmisStatusBadge } from '../../../components/students/StudentIdentifiers';
import { EXPORT_HEADERS, PORTAL_LABEL, PortalState, PortalStatus, SCHOOL_EMIS, emisSummary, exportRows, pendingChanges, portalStatus } from '../../../data/emis';
import { RosterStudent, checkEmis, formatEmis, matchesSearch } from '../../../data/students';
import { emisService, useEmisState } from '../../../services/emisService';
import { useRoster } from '../../../services/studentService';
import { Gate } from '../questionPapers/qpgUi';
import { AttendanceTab, PoolTab, QueueTab, StaffTab } from './EmisTabs';
import { PortalBadge, fmtDate, fmtStamp, tabBtn, td, th } from './emisUi';

type Tab = 'students' | 'queue' | 'pool' | 'staff' | 'attendance';

/** Admin → Compliance → TN EMIS: the school's link to the Tamil Nadu EMIS portal (STU-026, GOV-010, GOV-011). */
export const EmisView: React.FC = () => {
  const { addToast, currentUser } = useApp();
  const g = useGrants();
  const roster = useRoster();
  const state = useEmisState();
  const [tab, setTab] = useState<Tab>('students');
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<'' | 'sync' | 'upload'>('');
  const canUpdate = g.can('STU-026', 'U');
  const canExport = g.can('STU-026', 'E');

  const fetch = () => {
    setLoad('loading');
    emisService.load().then(
      () => setLoad('ready'),
      () => setLoad('error')
    );
  };
  useEffect(fetch, []);

  const summary = emisSummary(roster, state.portal, state.corrections);
  const queue = pendingChanges(roster, state.portal, state.corrections);

  const sync = async () => {
    setBusy('sync');
    try {
      await emisService.sync();
      addToast('EMIS records refreshed', 'success', `${summary.linked} of ${summary.onRolls} students linked`);
    } catch (e) {
      addToast('Could not reach the EMIS portal', 'error', (e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const upload = async () => {
    setBusy('upload');
    try {
      const log = await emisService.uploadPending(currentUser.name);
      const ok = log.results.filter(r => r.ok).length;
      const rejected = log.results.length - ok;
      addToast(`Uploaded ${ok} change${ok === 1 ? '' : 's'} to EMIS`, rejected ? 'warning' : 'success', rejected ? `${rejected} rejected — see the upload queue` : `Batch ${log.id}`);
      if (rejected) setTab('queue');
    } catch (e) {
      addToast('Upload failed', 'error', (e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const exportFile = () => {
    downloadCsv(`emis-students-${SCHOOL_EMIS.udiseCode}.csv`, EXPORT_HEADERS, exportRows(roster, state.portal));
    addToast('EMIS student file downloaded', 'success', `${roster.filter(s => !s.mergedInto).length} rows · export logged`);
  };

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'students', label: 'Students', icon: 'groups' },
    { id: 'queue', label: 'Upload queue', icon: 'cloud_upload', count: queue.length },
    { id: 'pool', label: 'Common pool & lookup', icon: 'swap_horiz' },
    { id: 'staff', label: 'Staff', icon: 'badge' },
    { id: 'attendance', label: 'Daily attendance', icon: 'fact_check', count: state.attendance.filter(d => d.status !== 'Uploaded').length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-20">
      <PageHeader
        eyebrow="Compliance · Tamil Nadu"
        icon="id_card"
        title="TN EMIS"
        subtitle="Keep student, staff and attendance records in step with the Tamil Nadu EMIS portal, which the state uses to track every student."
        actions={
          <>
            <button onClick={sync} disabled={busy !== ''} className={btnSoft}>
              <Icon name="sync" className={`text-sm ${busy === 'sync' ? 'animate-spin' : ''}`} />
              {busy === 'sync' ? 'Refreshing…' : 'Refresh from portal'}
            </button>
            <Gate allowed={canExport} why={g.why('STU-026', 'E')}>
              <button onClick={exportFile} className={btnSoft}>
                <Icon name="download" className="text-sm" />
                Download EMIS file
              </button>
            </Gate>
            <Gate allowed={canUpdate} why={g.why('STU-026', 'U')}>
              <button onClick={upload} disabled={busy !== '' || queue.length === 0} className={btnPrimary}>
                <Icon name="cloud_upload" className="text-sm" />
                {busy === 'upload' ? 'Uploading…' : `Upload ${queue.length} change${queue.length === 1 ? '' : 's'}`}
              </button>
            </Gate>
          </>
        }
      >
        <FeatureTags ids={['STU-026', 'GOV-010', 'GOV-011']} className="mt-2" />
      </PageHeader>

      <section className="rounded-2xl border border-[#cbe0ec] bg-[#f0f7fb] p-4 grid gap-3 md:grid-cols-[1fr_auto] items-start" aria-label="School on the EMIS portal">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-bold text-[#082b3d]">{SCHOOL_EMIS.name}</p>
          <p className="text-xs text-[#464555]">
            UDISE / EMIS school code <span className="font-mono font-semibold text-[#082b3d]">{SCHOOL_EMIS.udiseCode}</span> · {SCHOOL_EMIS.block} block, {SCHOOL_EMIS.district} district · {SCHOOL_EMIS.management}
          </p>
          <p className="text-[11px] text-[#777587]">
            Every Tamil Nadu student has a 16-digit EMIS number that follows them from school to school. The state uses it for enrolment, transfers, attendance, exams and welfare schemes, so each record
            here must match the portal.
          </p>
        </div>
        <div className="text-[11px] text-[#464555] md:text-right space-y-1">
          <p className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Connected to {SCHOOL_EMIS.portal} (demo)
          </p>
          <p data-testid="emis-last-sync">Last refreshed {fmtStamp(state.lastSync)}</p>
        </div>
      </section>

      {load === 'loading' ? (
        <Panel title="Loading EMIS records">
          <LoadingRows rows={5} label="Loading EMIS records" />
        </Panel>
      ) : load === 'error' ? (
        <Panel title="TN EMIS">
          <ErrorState message="Could not load EMIS records." onRetry={fetch} />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="emis-stats">
            <StatCard label="Linked on portal" value={`${summary.linked} / ${summary.onRolls}`} icon="verified" tone="green" hint={`${Math.round((summary.linked / Math.max(1, summary.onRolls)) * 100)}% of students on the rolls`} onClick={() => setTab('students')} />
            <StatCard label="No EMIS number" value={summary.missing} icon="help" tone="grey" hint="Find in the common pool" onClick={() => setTab('pool')} />
            <StatCard label="Needs attention" value={summary.toFix} icon="report" tone="amber" hint="Invalid numbers or details that differ" onClick={() => setTab('students')} />
            <StatCard label="Waiting to upload" value={summary.pending} icon="cloud_upload" hint="Changes not yet on the portal" onClick={() => setTab('queue')} />
            <StatCard label="Staff linked" value={`${summary.staffLinked} / ${summary.staff}`} icon="badge" tone={summary.staffLinked === summary.staff ? 'green' : 'amber'} hint="Teacher EMIS IDs" onClick={() => setTab('staff')} />
          </div>

          <div className="flex gap-1 border-b border-[#e0ecf4] overflow-x-auto" role="tablist" aria-label="EMIS views">
            {tabs.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={tabBtn(tab === t.id)} data-emis-tab={t.id}>
                <Icon name={t.icon} className="text-base" />
                {t.label}
                {Boolean(t.count) && <span className="ml-1 min-w-[18px] px-1 rounded-full bg-amber-100 text-amber-900 text-[10px] leading-[18px] text-center">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === 'students' && <StudentsTab canUpdate={canUpdate} why={g.why('STU-026', 'U')} onPool={() => setTab('pool')} />}
          {tab === 'queue' && <QueueTab canUpdate={canUpdate} why={g.why('STU-026', 'U')} onUpload={upload} uploading={busy === 'upload'} />}
          {tab === 'pool' && <PoolTab canUpdate={canUpdate} why={g.why('STU-026', 'U')} />}
          {tab === 'staff' && <StaffTab />}
          {tab === 'attendance' && <AttendanceTab canUpdate={canUpdate} why={g.why('STU-026', 'U')} />}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

const PORTAL_FILTERS: ('All' | PortalState)[] = ['All', 'linked', 'not-uploaded', 'mismatch', 'class', 'missing', 'fix', 'release', 'released'];

const StudentsTab: React.FC<{ canUpdate: boolean; why?: string; onPool: () => void }> = ({ canUpdate, why, onPool }) => {
  const roster = useRoster();
  const { portal } = useEmisState();
  const [query, setQuery] = useState('');
  const [portalFilter, setPortalFilter] = useState<'All' | PortalState>('All');
  const [classFilter, setClassFilter] = useState('All');
  const [editing, setEditing] = useState<RosterStudent | null>(null);
  const [reviewing, setReviewing] = useState<RosterStudent | null>(null);

  const rows = useMemo(
    () =>
      roster
        .filter(s => !s.mergedInto)
        .map(s => ({ s, st: portalStatus(s, roster, portal) }))
        .filter(({ s, st }) => (portalFilter === 'All' || st.state === portalFilter) && (classFilter === 'All' || String(s.classLevel) === classFilter) && (!query.trim() || matchesSearch(s, query)))
        .sort((a, b) => b.s.classLevel - a.s.classLevel || a.s.section.localeCompare(b.s.section) || a.s.name.localeCompare(b.s.name)),
    [roster, portal, query, portalFilter, classFilter]
  );

  return (
    <Panel
      title={`Students (${rows.length})`}
      actions={
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, admission no or EMIS" className={`${inputCls} w-56`} aria-label="Search EMIS students" />
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={inputCls} aria-label="Filter class">
            {['All', '10', '9', '8'].map(c => (
              <option key={c} value={c}>
                {c === 'All' ? 'All classes' : `Class ${c}`}
              </option>
            ))}
          </select>
          <select value={portalFilter} onChange={e => setPortalFilter(e.target.value as 'All' | PortalState)} className={inputCls} aria-label="Filter portal status">
            {PORTAL_FILTERS.map(f => (
              <option key={f} value={f}>
                {f === 'All' ? 'All portal states' : PORTAL_LABEL[f]}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon="search_off" title="No students match." text="Change the search or the filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="emis-students">
            <thead className="bg-slate-50 border-b border-[#e0ecf4]">
              <tr>
                {['Student', 'Class', 'EMIS number', 'Number check', 'Portal', 'Action'].map(h => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0ecf4]">
              {rows.map(({ s, st }) => (
                <tr key={s.id} data-emis-row={s.id} className="hover:bg-[#f8fbfd]">
                  <td className={td}>
                    <p className="font-semibold text-[#082b3d]">{s.name}</p>
                    <p className="text-[10px] text-[#777587]">
                      {s.admissionNo} · {s.status}
                    </p>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {s.classLevel}-{s.section}
                  </td>
                  <td className={`${td} font-mono whitespace-nowrap`}>{s.emis ? formatEmis(s.emis) : <span className="text-[#777587] font-sans">Not recorded</span>}</td>
                  <td className={td}>
                    <EmisStatusBadge check={checkEmis(s.emis, s.id, roster)} />
                  </td>
                  <td className={`${td} max-w-xs`}>
                    <PortalBadge state={st.state} />
                    <p className="mt-1 text-[10px] text-[#464555]">{st.detail}</p>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <RowAction student={s} status={st} canUpdate={canUpdate} why={why} onEdit={() => setEditing(s)} onReview={() => setReviewing(s)} onPool={onPool} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <EditIdentifiersModal student={editing} onClose={() => setEditing(null)} />
      <MismatchModal student={reviewing} canUpdate={canUpdate} why={why} onClose={() => setReviewing(null)} />
    </Panel>
  );
};

const RowAction: React.FC<{ student: RosterStudent; status: PortalStatus; canUpdate: boolean; why?: string; onEdit: () => void; onReview: () => void; onPool: () => void }> = ({
  student,
  status,
  canUpdate,
  why,
  onEdit,
  onReview,
  onPool,
}) => {
  if (status.state === 'mismatch')
    return (
      <button onClick={onReview} className={btnSoft} aria-label={`Review differences for ${student.name}`}>
        <Icon name="compare_arrows" className="text-sm" />
        Review
      </button>
    );
  if (status.state === 'missing')
    return (
      <div className="flex gap-1">
        <button onClick={onPool} className={btnSoft}>
          <Icon name="travel_explore" className="text-sm" />
          Find
        </button>
        <Gate allowed={canUpdate} why={why}>
          <button onClick={onEdit} className={btnSoft} aria-label={`Edit EMIS of ${student.name}`}>
            <Icon name="edit" className="text-sm" />
            Enter
          </button>
        </Gate>
      </div>
    );
  if (status.state === 'released') return <span className="text-[10px] text-[#777587]">No action</span>;
  return (
    <Gate allowed={canUpdate} why={why}>
      <button onClick={onEdit} className={btnSoft} aria-label={`Edit EMIS of ${student.name}`}>
        <Icon name="edit" className="text-sm" />
        {status.state === 'fix' ? 'Fix number' : 'Edit'}
      </button>
    </Gate>
  );
};

/** Details that differ between the school record and the portal, with a correction per field. */
const MismatchModal: React.FC<{ student: RosterStudent | null; canUpdate: boolean; why?: string; onClose: () => void }> = ({ student, canUpdate, why, onClose }) => {
  const { addToast, currentUser } = useApp();
  const roster = useRoster();
  const { portal, corrections } = useEmisState();
  if (!student) return null;
  const st = portalStatus(student, roster, portal);
  const queued = (field: string) => corrections.some(c => c.studentId === student.id && c.field === field);
  const send = async (field: PortalStatus['diffs'][number]['field'], value: string) => {
    try {
      await emisService.requestCorrection({ studentId: student.id, field, value, requestedBy: currentUser.name });
      addToast(`${field} correction queued for ${student.name}`, 'success', 'Sent with the next upload');
    } catch (e) {
      addToast('Could not queue the correction', 'error', (e as Error).message);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Portal differences · ${student.name}`}
      wide
      footer={
        <button onClick={onClose} className={btnSoft}>
          Close
        </button>
      }
    >
      <p className="text-[#464555]">
        EMIS {student.emis ? formatEmis(student.emis) : '—'} · Class {student.classLevel}-{student.section}. If the school record is right, send it to the portal. If the portal is right, raise a
        change request in Students so the school record is corrected with approval.
      </p>
      {st.diffs.length === 0 ? (
        <EmptyState icon="task_alt" title="Records match." text="Nothing differs any more." />
      ) : (
        <table className="w-full text-xs border border-[#e0ecf4] rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              {['Field', 'School record', 'EMIS portal', ''].map(h => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0ecf4]">
            {st.diffs.map(d => (
              <tr key={d.field}>
                <td className={`${td} font-semibold`}>{d.field}</td>
                <td className={td}>{d.field === 'Date of birth' ? fmtDate(d.ours) : d.ours}</td>
                <td className={`${td} text-rose-700`}>{d.field === 'Date of birth' ? fmtDate(d.portal) : d.portal}</td>
                <td className={`${td} text-right`}>
                  {queued(d.field) ? (
                    <span className="text-[10px] font-semibold text-emerald-700">Queued for upload</span>
                  ) : (
                    <Gate allowed={canUpdate} why={why}>
                      <button onClick={() => send(d.field, d.ours)} className={btnPrimary}>
                        Send school value
                      </button>
                    </Gate>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
};
