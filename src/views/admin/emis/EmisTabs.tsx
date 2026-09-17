import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Badge, EmptyState, Icon, Panel, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { AddStudentModal } from '../../../components/students/StudentIdentifiers';
import { ATTENDANCE_DUE, Correction, Lookup, STAFF_EMIS, SCHOOL_EMIS, StateRecord, TEACHER_ID_RULE, checkTeacherId, pendingChanges, poolMatchesFor, portalStatus } from '../../../data/emis';
import { RosterStudent, formatEmis } from '../../../data/students';
import { emisService, useEmisState } from '../../../services/emisService';
import { useRoster } from '../../../services/studentService';
import { Gate } from '../questionPapers/qpgUi';
import { ChangeBadge, PortalBadge, fmtDate, fmtStamp, td, th } from './emisUi';

interface ActionProps {
  canUpdate: boolean;
  why?: string;
}

// ---------------------------------------------------------------------------
// Upload queue
// ---------------------------------------------------------------------------

export const QueueTab: React.FC<ActionProps & { onUpload: () => void; uploading: boolean }> = ({ canUpdate, why, onUpload, uploading }) => {
  const { addToast } = useApp();
  const roster = useRoster();
  const { portal, corrections, lastResult, uploads } = useEmisState();
  const queue = pendingChanges(roster, portal, corrections);
  const [openLog, setOpenLog] = useState<string | null>(uploads[0]?.results.length ? uploads[0].id : null);

  const discard = async (studentId: string, field: Correction['field']) => {
    await emisService.discardCorrection(studentId, field);
    addToast('Correction removed from the queue', 'info');
  };

  return (
    <div className="space-y-4">
      <Panel
        title={`Waiting to upload (${queue.length})`}
        actions={
          <Gate allowed={canUpdate} why={why}>
            <button onClick={onUpload} disabled={uploading || queue.length === 0} className={btnPrimary}>
              <Icon name="cloud_upload" className="text-sm" />
              {uploading ? 'Uploading…' : 'Upload all'}
            </button>
          </Gate>
        }
      >
        {queue.length === 0 ? (
          <EmptyState icon="cloud_done" title="Everything is on the portal." text="New admissions, class changes, transfer certificates and corrections appear here until they are uploaded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="emis-queue">
              <thead className="bg-slate-50 border-b border-[#e0ecf4]">
                <tr>
                  {['Change', 'Student', 'EMIS number', 'What will be sent', 'Last attempt', ''].map(h => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0ecf4]">
                {queue.map(c => {
                  const last = lastResult[c.id];
                  return (
                    <tr key={c.id} data-queue-row={c.id}>
                      <td className={td}>
                        <ChangeBadge kind={c.kind} />
                      </td>
                      <td className={`${td} font-semibold text-[#082b3d]`}>{c.studentName}</td>
                      <td className={`${td} font-mono whitespace-nowrap`}>{c.emis ? formatEmis(c.emis) : '—'}</td>
                      <td className={td}>{c.summary}</td>
                      <td className={`${td} max-w-xs`}>
                        {last && !last.ok ? (
                          <span className="text-rose-700">
                            <span className="font-semibold">Rejected:</span> {last.message}
                          </span>
                        ) : (
                          <span className="text-[#777587]">Not sent yet</span>
                        )}
                      </td>
                      <td className={`${td} text-right`}>
                        {c.field && (
                          <Gate allowed={canUpdate} why={why}>
                            <button onClick={() => discard(c.studentId, c.field!)} className={btnSoft}>
                              Discard
                            </button>
                          </Gate>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Upload history">
        <ul className="divide-y divide-[#e0ecf4]">
          {uploads.map(u => {
            const ok = u.results.filter(r => r.ok).length;
            const rejected = u.results.length - ok;
            const open = openLog === u.id;
            return (
              <li key={u.id} data-upload={u.id}>
                <button onClick={() => setOpenLog(open ? null : u.id)} className="w-full flex flex-wrap items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#f8fbfd]" aria-expanded={open}>
                  <span className="font-mono font-semibold text-[#082b3d]">{u.id}</span>
                  <span className="text-[#464555]">
                    {fmtStamp(u.at)} · {u.by}
                  </span>
                  <span className="ml-auto flex gap-1">
                    <Badge tone="green">{ok} accepted</Badge>
                    {rejected > 0 && <Badge tone="red">{rejected} rejected</Badge>}
                  </span>
                  <Icon name={open ? 'expand_less' : 'expand_more'} className="text-base text-[#777587]" />
                </button>
                {open && (
                  <ul className="px-3 pb-3 space-y-1">
                    {u.results.length === 0 && <li className="text-[11px] text-[#777587]">Routine refresh; no changes were sent.</li>}
                    {u.results.map(r => (
                      <li key={r.id} className="flex items-start gap-2 text-[11px]">
                        <Icon name={r.ok ? 'check_circle' : 'cancel'} className={`text-sm ${r.ok ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span>
                          <span className="font-semibold">{r.studentName}</span> · <ChangeBadge kind={r.kind} /> {r.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Common pool and lookup
// ---------------------------------------------------------------------------

const RecordCard: React.FC<{ record: StateRecord }> = ({ record }) => (
  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
    {[
      ['Name', record.name],
      ['Date of birth', fmtDate(record.dob)],
      ['Gender', record.gender],
      ['Class', `${record.classLevel}-${record.section}`],
      ['EMIS number', formatEmis(record.emis)],
      ['School', record.schoolName],
      ['School code', record.udiseCode],
      ['Portal status', record.status],
    ].map(([k, v]) => (
      <div key={k}>
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-[#777587]">{k}</dt>
        <dd className={`font-semibold text-[#082b3d] ${k === 'EMIS number' || k === 'School code' ? 'font-mono' : ''}`}>{v}</dd>
      </div>
    ))}
  </dl>
);

export const PoolTab: React.FC<ActionProps> = ({ canUpdate, why }) => {
  const { addToast } = useApp();
  const roster = useRoster();
  const { portal } = useEmisState();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Lookup | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');
  const [admit, setAdmit] = useState<StateRecord | null>(null);

  const withoutEmis = roster.filter(s => portalStatus(s, roster, portal).state === 'missing');
  const leavers = roster.filter(s => !s.mergedInto && ['release', 'released'].includes(portalStatus(s, roster, portal).state));

  const lookup = async (emis = value) => {
    setLooking(true);
    setError('');
    try {
      setResult(await emisService.lookup(emis));
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setLooking(false);
    }
  };

  const link = async (student: RosterStudent, record: StateRecord) => {
    try {
      await emisService.linkNumber(student.id, record.emis);
      addToast(`EMIS ${formatEmis(record.emis)} linked to ${student.name}`, 'success', 'Upload the queue to move the student to this school on the portal');
      if (result?.state === 'found') setResult(await emisService.lookup(record.emis));
    } catch (e) {
      addToast('Could not link the number', 'error', (e as Error).message);
    }
  };

  const matchFor = (record: StateRecord) => withoutEmis.find(s => poolMatchesFor(s, portal).some(r => r.emis === record.emis));

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Panel title="Look up an EMIS number">
        <form
          className="p-3 space-y-3"
          onSubmit={e => {
            e.preventDefault();
            lookup();
          }}
        >
          <p className="text-[11px] text-[#464555]">
            A student joining from another Tamil Nadu school keeps their EMIS number. The previous school releases them to the common pool, and this school then admits them with the same number.
          </p>
          <div className="flex gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} inputMode="numeric" placeholder="33XX XXXX XXXX XXXX" className={`${inputCls} flex-1 font-mono`} aria-label="EMIS number to look up" />
            <button type="submit" disabled={looking || !value.trim()} className={btnPrimary}>
              <Icon name="travel_explore" className="text-sm" />
              {looking ? 'Looking up…' : 'Look up'}
            </button>
          </div>
          <p className="text-[10px] text-[#777587]">
            Try 3303 1506 0011 4455 (in the common pool) or 3302 1104 0021 8841 (still at another school).
          </p>
        </form>
        <div className="px-3 pb-3" aria-live="polite" data-testid="emis-lookup">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800" role="alert">
              {error}
            </p>
          )}
          {result?.state === 'invalid' && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{result.message}</p>}
          {result?.state === 'not-found' && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-[#464555]">
              No student on the portal has this number. Check it with the family; a student new to Tamil Nadu schools gets a number when this school adds them on the portal.
            </p>
          )}
          {result?.state === 'found' && (
            <div className="rounded-xl border border-[#cbe0ec] p-3 space-y-3">
              <RecordCard record={result.record} />
              {result.relation === 'ours' && (
                <p className="text-xs text-emerald-800">
                  <Icon name="verified" className="text-sm align-middle" /> Already on our rolls{result.linkedTo ? ` as ${result.linkedTo.name} (${result.linkedTo.admissionNo})` : ''}.
                </p>
              )}
              {result.relation === 'other-school' && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  Still studying at {result.record.schoolName}. That school must issue a transfer certificate and release the student to the common pool before we can admit them.
                </p>
              )}
              {result.relation === 'pool' &&
                (result.linkedTo ? (
                  <p className="text-xs text-[#0e5d84]">Linked to {result.linkedTo.name}. Upload the queue to complete the transfer on the portal.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-emerald-800 flex-1">In the common pool: ready to admit.</p>
                    {matchFor(result.record) ? (
                      <Gate allowed={canUpdate} why={why}>
                        <button onClick={() => link(matchFor(result.record)!, result.record)} className={btnPrimary}>
                          Link to {matchFor(result.record)!.name}
                        </button>
                      </Gate>
                    ) : (
                      <Gate allowed={canUpdate} why={why}>
                        <button onClick={() => setAdmit(result.record)} className={btnPrimary}>
                          <Icon name="person_add" className="text-sm" />
                          Admit with this record
                        </button>
                      </Gate>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title={`Students without an EMIS number (${withoutEmis.length})`}>
          {withoutEmis.length === 0 ? (
            <EmptyState icon="task_alt" title="Every student has a number." />
          ) : (
            <ul className="divide-y divide-[#e0ecf4]">
              {withoutEmis.map(s => {
                const matches = poolMatchesFor(s, portal);
                return (
                  <li key={s.id} className="p-3 space-y-2" data-pool-student={s.id}>
                    <p className="text-xs">
                      <span className="font-semibold text-[#082b3d]">{s.name}</span> · Class {s.classLevel}-{s.section} · born {fmtDate(s.dob)}
                    </p>
                    {matches.length === 0 ? (
                      <p className="text-[11px] text-[#777587]">No match in the common pool. Ask the family for the number from the previous school.</p>
                    ) : (
                      matches.map(r => (
                        <div key={r.emis} className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px]">
                          <span className="flex-1 min-w-0">
                            Match in the common pool: <span className="font-mono font-semibold">{formatEmis(r.emis)}</span>, released by {r.schoolName}
                          </span>
                          <button
                            onClick={() => {
                              setValue(formatEmis(r.emis));
                              lookup(r.emis);
                            }}
                            className={btnSoft}
                          >
                            View
                          </button>
                          <Gate allowed={canUpdate} why={why}>
                            <button onClick={() => link(s, r)} className={btnPrimary} aria-label={`Link ${formatEmis(r.emis)} to ${s.name}`}>
                              Link
                            </button>
                          </Gate>
                        </div>
                      ))
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Students who left">
          {leavers.length === 0 ? (
            <EmptyState icon="logout" title="No leavers." />
          ) : (
            <ul className="divide-y divide-[#e0ecf4]">
              {leavers.map(s => {
                const st = portalStatus(s, roster, portal);
                return (
                  <li key={s.id} className="p-3 flex flex-wrap items-start gap-2 text-xs">
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold text-[#082b3d]">{s.name}</span> · {s.status} · {s.emis ? formatEmis(s.emis) : 'no EMIS'}
                      <span className="block text-[10px] text-[#464555]">{st.detail}</span>
                    </span>
                    <PortalBadge state={st.state} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <AddStudentModal
        open={Boolean(admit)}
        onClose={() => setAdmit(null)}
        initial={admit ? { name: admit.name, gender: admit.gender, dob: admit.dob, classLevel: admit.classLevel, emis: admit.emis } : undefined}
        onCreated={() => {
          if (admit) lookup(admit.emis);
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export const StaffTab: React.FC = () => (
  <Panel title={`Teacher EMIS IDs (${STAFF_EMIS.length})`}>
    <p className="px-3 pt-3 text-[11px] text-[#464555]">
      The portal also tracks every teacher: postings, subjects and training. IDs are kept on the staff record in Teachers; this list shows which ones are ready for the state return. Format:{' '}
      {TEACHER_ID_RULE}
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-xs mt-2" data-testid="emis-staff">
        <thead className="bg-slate-50 border-y border-[#e0ecf4]">
          <tr>
            {['Staff member', 'Role', 'Teacher EMIS ID', 'Status'].map(h => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e0ecf4]">
          {STAFF_EMIS.map(s => {
            const state = checkTeacherId(s.teacherId);
            return (
              <tr key={s.id}>
                <td className={`${td} font-semibold text-[#082b3d]`}>{s.name}</td>
                <td className={td}>{s.role}</td>
                <td className={`${td} font-mono`}>{s.teacherId || <span className="font-sans text-[#777587]">Not recorded</span>}</td>
                <td className={td}>
                  {state === 'valid' ? <Badge tone="green">Linked</Badge> : state === 'missing' ? <Badge tone="grey">Missing</Badge> : <Badge tone="red">Invalid: must be 8 digits</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </Panel>
);

// ---------------------------------------------------------------------------
// Daily attendance
// ---------------------------------------------------------------------------

export const AttendanceTab: React.FC<ActionProps> = ({ canUpdate, why }) => {
  const { addToast } = useApp();
  const { attendance } = useEmisState();
  const [busy, setBusy] = useState('');
  const upload = async (date: string) => {
    setBusy(date);
    try {
      const d = await emisService.uploadAttendance(date);
      addToast(`Attendance for ${fmtDate(date)} uploaded`, d.note ? 'warning' : 'success', d.note ?? `${d.present} of ${d.onRoll} present`);
    } catch (e) {
      addToast('Attendance upload failed', 'error', (e as Error).message);
    } finally {
      setBusy('');
    }
  };
  return (
    <Panel title="Daily attendance on the portal">
      <p className="px-3 pt-3 text-[11px] text-[#464555]">
        The state expects school-wide attendance for every working day by {ATTENDANCE_DUE} AM (demo rule). Counts come from the attendance register for all classes at {SCHOOL_EMIS.name}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs mt-2" data-testid="emis-attendance">
          <thead className="bg-slate-50 border-y border-[#e0ecf4]">
            <tr>
              {['Date', 'On roll', 'Present', 'Attendance', 'Portal', ''].map(h => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0ecf4]">
            {attendance.map(d => (
              <tr key={d.date} data-attendance-day={d.date}>
                <td className={`${td} font-semibold whitespace-nowrap`}>{fmtDate(d.date)}</td>
                <td className={td}>{d.onRoll.toLocaleString('en-IN')}</td>
                <td className={td}>{d.present.toLocaleString('en-IN')}</td>
                <td className={td}>{((d.present / d.onRoll) * 100).toFixed(1)}%</td>
                <td className={`${td} max-w-xs`}>
                  <Badge tone={d.status === 'Uploaded' ? 'green' : d.status === 'Failed' ? 'red' : 'amber'}>{d.status}</Badge>
                  <p className="mt-1 text-[10px] text-[#464555]">
                    {d.at ? `${fmtStamp(d.at)}` : 'Not sent'}
                    {d.note ? ` · ${d.note}` : ''}
                  </p>
                </td>
                <td className={`${td} text-right`}>
                  {d.status !== 'Uploaded' && (
                    <Gate allowed={canUpdate} why={why}>
                      <button onClick={() => upload(d.date)} disabled={busy !== ''} className={btnPrimary} aria-label={`Upload attendance for ${fmtDate(d.date)}`}>
                        <Icon name="cloud_upload" className="text-sm" />
                        {busy === d.date ? 'Uploading…' : d.status === 'Failed' ? 'Retry' : 'Upload'}
                      </button>
                    </Gate>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};
