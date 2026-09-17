// Parent app: Hall of Fame, transport, hostel and appearance (APP-001, APP-005, APP-010, APP-015).
import React, { useMemo, useState } from 'react';
import type { RosterStudent } from '../../src/data/students';
import { Achievement, RankTier, ordinal } from '../../src/data/hallOfFame';
import { Allocation, SCHOOL_STOP_NAME, TripState } from '../../src/data/transport';
import { HostelView, RollCallStatus } from '../../src/data/hostel';
import { hallOfFameService } from '../../src/services/hallOfFameService';
import { transportService } from '../../src/services/transportService';
import { hostelService } from '../../src/services/hostelService';
import { APP_NOW } from '../shared/schoolData';
import { THEME_OPTIONS, ThemeChoice, resolveTheme, useTheme } from '../shared/settingsService';
import { Card, EmptyState, ErrorCard, FeatureFooter, Icon, LoadingCard, Pill, Screen, SecondaryButton, cx, fmtDate, useAsync } from '../shared/mobileUi';

const firstName = (name: string) => name.split(' ')[0];
const time12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// ---------------------------------------------------------------------------
// Hall of Fame
// ---------------------------------------------------------------------------

const TIER: Record<RankTier, { label: string; ring: string; icon: string; badge: string; card: string }> = {
  gold: { label: 'Gold', ring: 'from-amber-300 via-yellow-200 to-amber-500', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-900', card: 'border-amber-300 bg-gradient-to-br from-amber-50 to-[var(--surface)]' },
  silver: { label: 'Silver', ring: 'from-slate-300 via-slate-100 to-slate-400', icon: 'text-slate-500', badge: 'bg-slate-200 text-slate-800', card: 'border-slate-300 bg-gradient-to-br from-slate-100 to-[var(--surface)]' },
  bronze: { label: 'Bronze', ring: 'from-orange-300 via-amber-100 to-orange-500', icon: 'text-orange-700', badge: 'bg-orange-100 text-orange-900', card: 'border-orange-300 bg-gradient-to-br from-orange-50 to-[var(--surface)]' },
};

const Trophy: React.FC<{ tier: RankTier; size?: 'md' | 'lg'; animate?: boolean }> = ({ tier, size = 'md', animate }) => (
  <span className={cx('relative inline-flex items-center justify-center rounded-full bg-gradient-to-br p-[3px] shrink-0 overflow-hidden', TIER[tier].ring, size === 'lg' ? 'w-28 h-28' : 'w-14 h-14', animate && 'hof-reveal')} aria-hidden="true">
    <span className="w-full h-full rounded-full bg-[var(--surface)] flex items-center justify-center">
      <Icon name="emoji_events" filled className={cx(TIER[tier].icon, size === 'lg' ? 'text-[56px]' : 'text-[30px]')} />
    </span>
    {animate && <span className="hof-shine" />}
  </span>
);

/** Home screen card. Renders nothing while loading and nothing for children without a top-three place. */
export const HallOfFameCard: React.FC<{ child: RosterStudent; onOpen: () => void }> = ({ child, onOpen }) => {
  const res = useAsync(() => hallOfFameService.achievements(child.id), [child.id]);
  if (res.status === 'loading') return <LoadingCard label="Loading Hall of Fame" lines={2} />;
  if (res.status === 'error' || res.data.length === 0) return null;
  const best = res.data[0];
  const more = res.data.length - 1;
  return (
    <button onClick={onOpen} className={cx('w-full text-left rounded-2xl border p-4 flex gap-3 items-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]', TIER[best.tier].card)} data-hof={best.tier} aria-label={`Hall of Fame: ${best.studentName}, ${ordinal(best.rank)} rank in ${best.subject}`}>
      <Trophy tier={best.tier} />
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--gold)]">Hall of Fame</span>
        <span className="block text-[13px] text-slate-600">Congratulations!</span>
        <span className="block text-[15px] font-semibold text-slate-900 leading-snug">
          {best.studentName} secured {ordinal(best.rank)} rank in {best.subject}
        </span>
        <span className="block text-[12px] text-slate-500">
          {best.exam} · {best.marks} / {best.max}
          {more > 0 && ` · +${more} more`}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--accent-ink)]">
          View achievement <Icon name="arrow_forward" className="text-[14px]" />
        </span>
      </span>
    </button>
  );
};

export const HallOfFamePage: React.FC<{ child: RosterStudent; lowData: boolean; onResults: () => void }> = ({ child, lowData, onResults }) => {
  const res = useAsync(() => hallOfFameService.achievements(child.id), [child.id]);
  const [index, setIndex] = useState(0);
  if (res.status === 'loading')
    return (
      <Screen>
        <LoadingCard label="Loading achievement" lines={5} />
      </Screen>
    );
  if (res.status === 'error')
    return (
      <Screen>
        <ErrorCard onRetry={res.retry} />
      </Screen>
    );
  const list = res.data;
  if (list.length === 0)
    return (
      <Screen>
        <Card>
          <EmptyState icon="emoji_events" text="No Hall of Fame achievement yet." />
          <p className="text-center text-[12px] text-slate-500 -mt-4 pb-2">A place in the top three of a published exam appears here.</p>
          <SecondaryButton onClick={onResults} className="w-full">
            See {firstName(child.name)}’s results
          </SecondaryButton>
        </Card>
        <FeatureFooter ids={['APP-005', 'EXM-018', 'EXM-026']} />
      </Screen>
    );
  const a: Achievement = list[Math.min(index, list.length - 1)];
  return (
    <Screen>
      <section key={a.id} className={cx('relative rounded-3xl border p-6 text-center space-y-3 overflow-hidden', TIER[a.tier].card)} aria-labelledby="hof-title" data-hof-detail={a.tier}>
        <Trophy tier={a.tier} size="lg" animate />
        <div className="flex items-center justify-center gap-2">
          {!lowData && child.avatar ? (
            <img src={child.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--surface)]" referrerPolicy="no-referrer" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-slate-100 ring-2 ring-[var(--surface)] flex items-center justify-center text-[14px] font-bold text-slate-600">{child.name[0]}</span>
          )}
          <span className="text-[13px] text-slate-600">
            {a.studentName} · Class {a.classLevel}-{a.section}
          </span>
        </div>
        <h2 id="hof-title" className="text-[20px] font-bold text-slate-900">
          Congratulations, {firstName(a.studentName)}!
        </h2>
        <p className="text-[28px] font-extrabold text-slate-900 leading-none">{ordinal(a.rank)} Rank</p>
        <span className={cx('inline-block rounded-full px-3 py-1 text-[12px] font-semibold', TIER[a.tier].badge)}>{TIER[a.tier].label} · {a.subject}</span>
        <dl className="grid grid-cols-2 gap-2 text-left pt-2">
          {[
            ['Student', a.studentName],
            ['Class', `Class ${a.classLevel}-${a.section}`],
            ['Subject', a.subject],
            ['Exam', a.exam],
            ['Marks', `${a.marks} / ${a.max}`],
            ['Percentage', `${a.percentage}%`],
            ['Academic year', a.academicYear],
            ['Rank', `${ordinal(a.rank)} of ${a.classSize} in Class ${a.classLevel}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--surface)]/70 px-3 py-2">
              <dt className="text-[11px] text-slate-500">{k}</dt>
              <dd className="text-[13px] font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-slate-500">Results published {fmtDate(a.publishedOn)}. Ranks are across all sections of the class.</p>
      </section>
      {list.length > 1 && (
        <Card title={`All achievements (${list.length})`}>
          {list.map((x, i) => (
            <button key={x.id} onClick={() => setIndex(i)} aria-pressed={i === index} className={cx('w-full flex items-center gap-3 py-2 border-b last:border-0 border-slate-100 text-left', i === index && 'font-semibold')}>
              <Icon name="emoji_events" filled className={cx('text-[22px]', TIER[x.tier].icon)} />
              <span className="flex-1 text-[13px]">
                {ordinal(x.rank)} in {x.subject}
              </span>
              <span className="text-[12px] text-slate-500">
                {x.marks}/{x.max}
              </span>
            </button>
          ))}
        </Card>
      )}
      <FeatureFooter ids={['APP-005', 'EXM-018', 'EXM-026']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const PHASE_TONE: Record<TripState['phase'], 'green' | 'amber' | 'blue' | 'grey'> = {
  'Not started': 'grey',
  'On route': 'green',
  'Reached school': 'blue',
  'Drop trip on route': 'green',
  'All dropped': 'grey',
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0 border-slate-100 text-[13px]">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-900">{value}</span>
  </div>
);

const Contact: React.FC<{ name: string; role: string; phone: string; note?: string }> = ({ name, role, phone, note }) => (
  <div className="flex items-center gap-3">
    <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
      <Icon name={role === 'Driver' ? 'person' : role === 'Attendant' ? 'support_agent' : 'shield_person'} />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-semibold text-slate-900">{name}</p>
      <p className="text-[12px] text-slate-500">
        {role}
        {note ? ` · ${note}` : ''}
      </p>
    </div>
    <a href={`tel:${phone.replace(/\s/g, '')}`} className="rounded-full bg-[var(--accent)] text-white w-10 h-10 flex items-center justify-center" aria-label={`Call ${name}`}>
      <Icon name="call" className="text-[20px]" />
    </a>
  </div>
);

export const TransportCard: React.FC<{ child: RosterStudent; onOpen: () => void }> = ({ child, onOpen }) => {
  const res = useAsync(() => transportService.allocation(child.id), [child.id]);
  if (res.status === 'loading') return <LoadingCard label="Loading transport" lines={2} />;
  if (res.status === 'error') return <ErrorCard onRetry={res.retry} />;
  const a = res.data;
  if (!a) return null;
  const trip = transportService.trip(a, APP_NOW);
  return (
    <Card onClick={onOpen} title={<span className="flex items-center gap-1.5"><Icon name="directions_bus" className="text-[18px] text-[var(--accent-ink)]" />School transport</span>} action={<Pill tone={PHASE_TONE[trip.phase]}>{trip.phase}</Pill>}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]" data-transport-card={a.route.number}>
        <p className="text-slate-500">Route</p>
        <p className="font-semibold text-slate-900 text-right">{a.route.number}</p>
        <p className="text-slate-500">Vehicle</p>
        <p className="font-semibold text-slate-900 text-right">{a.vehicle.registration}</p>
        <p className="text-slate-500">Pickup</p>
        <p className="font-semibold text-slate-900 text-right">
          {a.pickup.name} · {time12(a.pickup.pickup)}
        </p>
        <p className="text-slate-500">Drop</p>
        <p className="font-semibold text-slate-900 text-right">{a.drop.name}</p>
        <p className="text-slate-500">Driver</p>
        <p className="font-semibold text-slate-900 text-right">{a.driver.name}</p>
        <p className="text-slate-500">Attendant</p>
        <p className="font-semibold text-slate-900 text-right">{a.attendant.name}</p>
      </div>
    </Card>
  );
};

const DEMO_TIMES = [
  { at: '07:28', label: '7:28 AM' },
  { at: APP_NOW, label: 'Now' },
  { at: '16:02', label: '4:02 PM' },
];

const RouteMap: React.FC<{ a: Allocation; trip: TripState }> = ({ a, trip }) => {
  const pts = a.route.stops.map(s => `${s.x},${s.y}`).join(' ');
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50" role="img" aria-label={`Map placeholder: bus near ${trip.lastStop?.name ?? a.route.stops[0].name}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-44">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-slate-200" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.7" />
        {a.route.stops.map(s => (
          <circle key={s.id} cx={s.x} cy={s.y} r={s.id === a.pickup.id ? 2.4 : 1.6} fill={s.id === a.pickup.id ? '#f59e0b' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700" style={{ left: `${trip.x}%`, top: `${(trip.y / 100) * 176}px` }} aria-hidden="true">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-white shadow-lg ring-4 ring-[var(--accent)]/20">
          <Icon name="directions_bus" filled className="text-[18px]" />
        </span>
      </span>
      <span className="absolute left-2 bottom-2 rounded-md bg-[var(--surface)]/90 px-2 py-0.5 text-[10px] text-slate-600">Map placeholder · demo position</span>
    </div>
  );
};

export const TransportPage: React.FC<{ child: RosterStudent }> = ({ child }) => {
  const res = useAsync(() => transportService.allocation(child.id), [child.id]);
  const [now, setNow] = useState(APP_NOW);
  const trip = useMemo(() => (res.status === 'ready' && res.data ? transportService.trip(res.data, now) : null), [res, now]);
  if (res.status === 'loading')
    return (
      <Screen>
        <LoadingCard label="Loading transport" lines={4} />
        <LoadingCard label="Loading vehicle" lines={2} />
      </Screen>
    );
  if (res.status === 'error')
    return (
      <Screen>
        <ErrorCard onRetry={res.retry} />
      </Screen>
    );
  const a = res.data;
  if (!a || !trip)
    return (
      <Screen>
        <Card>
          <EmptyState icon="no_transfer" text={`${firstName(child.name)} does not use school transport.`} />
          <p className="text-center text-[12px] text-slate-500 -mt-4">To request a seat, contact the school transport office. Seats depend on route capacity.</p>
        </Card>
        <FeatureFooter ids={['APP-010', 'TRN-005']} />
      </Screen>
    );
  const morning = a.route.stops;
  return (
    <Screen>
      <Card
        title="Live bus tracking"
        action={<Pill tone={PHASE_TONE[trip.phase]}>{trip.phase}</Pill>}
      >
        <RouteMap a={a} trip={trip} />
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-slate-600">
            {trip.phase === 'On route' || trip.phase === 'Drop trip on route'
              ? `Near ${trip.lastStop?.name} → ${trip.nextStop?.name}`
              : trip.phase === 'Not started'
                ? `Starts from ${morning[0].name} at ${time12(morning[0].pickup)}`
                : trip.phase === 'Reached school'
                  ? `Reached ${SCHOOL_STOP_NAME}`
                  : 'All students dropped'}
          </span>
          <span className="text-slate-500">Last updated {time12(trip.updatedAt)}</span>
        </div>
        {trip.etaMinutes !== undefined && trip.etaMinutes >= 0 && (
          <p className="mt-1 text-[13px] font-semibold text-emerald-700">
            {trip.etaMinutes === 0
              ? `At ${a.pickup.name} now`
              : trip.phase === 'Drop trip on route'
                ? `About ${trip.etaMinutes} min to drop-off at ${a.pickup.name}`
                : `About ${trip.etaMinutes} min to pickup at ${a.pickup.name}`}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1.5" role="group" aria-label="Demo clock">
          <span className="text-[11px] text-slate-500 mr-1">Demo clock</span>
          {DEMO_TIMES.map(d => (
            <button key={d.at} onClick={() => setNow(d.at)} aria-pressed={now === d.at} className={cx('px-2.5 py-1 rounded-full text-[11px] border', now === d.at ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-slate-300 text-slate-600')}>
              {d.label}
            </button>
          ))}
        </div>
        {!a.vehicle.gps && <p className="mt-2 text-[11px] text-amber-800">This bus has no GPS unit yet; the position is estimated from the timetable.</p>}
      </Card>

      <Card title="Route information">
        <Row label="Route number" value={a.route.number} />
        <Row label="Route name" value={a.route.name} />
        <Row label="Pickup stop" value={a.pickup.name} />
        <Row label="Drop stop" value={a.drop.name} />
        <Row label="Pickup time" value={time12(a.pickup.pickup)} />
        <Row label="Drop time (afternoon)" value={`${time12(a.pickup.drop)} at ${a.pickup.name}`} />
      </Card>

      <Card title="Vehicle">
        <Row label="Vehicle number" value={a.vehicle.registration} />
        <Row label="Vehicle type" value={a.vehicle.type} />
        <Row label="Capacity" value={`${a.vehicle.capacity} seats · ${a.vehicle.onBoard} allotted`} />
        <Row label="Fitness certificate" value={`Valid to ${fmtDate(a.vehicle.fitnessValidTill)}`} />
      </Card>

      <Card title="Driver and attendant">
        <div className="space-y-3">
          <Contact name={a.driver.name} role="Driver" phone={a.driver.phone} note={`${a.driver.experienceYears} years`} />
          <Contact name={a.attendant.name} role="Attendant" phone={a.attendant.phone} />
        </div>
      </Card>

      <Card title="Stops (morning)">
        <ol className="relative border-l-2 border-slate-200 ml-2">
          {morning.map(s => (
            <li key={s.id} className="ml-4 py-1.5">
              <span className={cx('absolute -left-[7px] mt-1 w-3 h-3 rounded-full border-2', s.id === a.pickup.id ? 'bg-amber-400 border-amber-500' : 'bg-[var(--surface)] border-slate-300')} aria-hidden="true" />
              <p className={cx('text-[13px]', s.id === a.pickup.id ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                {s.name}
                {s.id === a.pickup.id && ' · your stop'}
              </p>
              <p className="text-[11px] text-slate-500">
                {time12(s.pickup)} · {s.landmark}
              </p>
            </li>
          ))}
        </ol>
      </Card>
      <FeatureFooter ids={['APP-010', 'TRN-001', 'TRN-002', 'TRN-003', 'TRN-004', 'TRN-005', 'TRN-008', 'TRN-009']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Hostel
// ---------------------------------------------------------------------------

const ROLL_TONE: Record<RollCallStatus, 'green' | 'amber' | 'blue' | 'red'> = { Present: 'green', Late: 'amber', 'On outpass': 'blue', Absent: 'red' };
const OUTPASS_TONE = { Pending: 'amber', Approved: 'green', Rejected: 'red', Returned: 'grey' } as const;

export const HostelCard: React.FC<{ child: RosterStudent; onOpen: () => void }> = ({ child, onOpen }) => {
  const res = useAsync(() => hostelService.forStudent(child.id), [child.id]);
  if (res.status === 'loading') return <LoadingCard label="Loading hostel" lines={2} />;
  if (res.status === 'error') return <ErrorCard onRetry={res.retry} />;
  const h = res.data;
  if (!h) return null;
  const last = h.rollCalls[0];
  return (
    <Card onClick={onOpen} title={<span className="flex items-center gap-1.5"><Icon name="apartment" className="text-[18px] text-[var(--accent-ink)]" />Hostel</span>} action={<Pill tone="green">{h.residence.status}</Pill>}>
      <div className="flex items-end justify-between gap-3" data-hostel-card={h.residence.room}>
        <div>
          <p className="text-[16px] font-semibold text-slate-900">{h.residence.block}</p>
          <p className="text-[13px] text-slate-600">
            Room {h.residence.room} · {h.residence.bed}
          </p>
        </div>
        {last && (
          <p className="text-right text-[11px] text-slate-500">
            Last roll call
            <br />
            <span className="font-semibold text-slate-800">
              {last.status} · {fmtDate(last.date)}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
};

export const HostelPage: React.FC<{ child: RosterStudent }> = ({ child }) => {
  const res = useAsync(() => hostelService.forStudent(child.id), [child.id]);
  if (res.status === 'loading')
    return (
      <Screen>
        <LoadingCard label="Loading hostel" lines={4} />
        <LoadingCard label="Loading roll call" lines={3} />
      </Screen>
    );
  if (res.status === 'error')
    return (
      <Screen>
        <ErrorCard onRetry={res.retry} />
      </Screen>
    );
  const h: HostelView | null = res.data;
  if (!h)
    return (
      <Screen>
        <Card>
          <EmptyState icon="night_shelter" text={`${firstName(child.name)} is a day scholar and has no hostel room.`} />
          <p className="text-center text-[12px] text-slate-500 -mt-4">For hostel admission, contact the hostel office.</p>
        </Card>
        <FeatureFooter ids={['HST-003']} />
      </Screen>
    );
  const r = h.residence;
  const op = h.currentOutpass;
  return (
    <Screen>
      <Card title="Hostel" action={<Pill tone="green">{r.status}</Pill>}>
        <div className="grid grid-cols-3 gap-2 text-center" data-hostel-detail={r.room}>
          {[
            ['Block', r.block],
            ['Room', r.room],
            ['Bed', r.bed.replace('Bed ', '')],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 py-2">
              <p className="text-[11px] text-slate-500">{k}</p>
              <p className="text-[16px] font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Row label="Hostel" value={h.hostel.name} />
          <Row label="Floor" value={`Floor ${r.floor}`} />
          <Row label="Room type" value={r.roomType} />
          <Row label="Roommates" value={r.roommates.join(', ')} />
        </div>
      </Card>

      <Card title="Warden">
        <div className="space-y-3">
          <Contact name={h.hostel.warden.name} role="Warden" phone={h.hostel.warden.phone} note={h.hostel.warden.availableHours} />
          <Contact name={h.hostel.deputyWarden.name} role="Night warden" phone={h.hostel.deputyWarden.phone} note={h.hostel.deputyWarden.availableHours} />
        </div>
      </Card>

      <Card title="Residence">
        <Row label="Check-in date" value={fmtDate(r.checkInOn)} />
        <Row label="Status" value={r.status} />
        <Row label="Boarding" value={r.boarding} />
        <Row label="Mess" value={r.mess} />
      </Card>

      <Card title="Night roll call" action={<span className="text-[12px] font-semibold text-slate-700">{h.attendancePct}% present</span>}>
        {h.rollCalls.map(c => (
          <div key={c.date} className="flex items-center justify-between py-1.5 border-b last:border-0 border-slate-100 text-[13px]">
            <span>{fmtDate(c.date)}</span>
            <span className="text-[11px] text-slate-500">{c.markedAt !== '—' ? `${c.markedAt} · ${c.by}` : c.by}</span>
            <Pill tone={ROLL_TONE[c.status]}>{c.status}</Pill>
          </div>
        ))}
        <p className="mt-1 text-[11px] text-slate-500">Nights on an approved outpass are not counted.</p>
      </Card>

      <Card title="Leave and outpass">
        {op ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-900">Next: {op.reason}</p>
              <Pill tone={OUTPASS_TONE[op.status]}>{op.status}</Pill>
            </div>
            <p className="text-[12px] text-slate-600">
              {fmtDate(op.from)} {op.from.slice(11)} → {fmtDate(op.to)} {op.to.slice(11)}
            </p>
            <p className="text-[11px] text-slate-500">
              Escort: {op.escort}
              {op.decidedBy ? ` · approved by ${op.decidedBy}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500 mb-2">No outpass is open.</p>
        )}
        {h.outpasses
          .filter(o => o.id !== op?.id)
          .map(o => (
            <div key={o.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-slate-100 text-[12px]">
              <span>
                {o.reason}
                <span className="block text-[11px] text-slate-500">
                  {fmtDate(o.from)} → {fmtDate(o.to)}
                  {o.returnedAt ? ` · back ${o.returnedAt.slice(11)}` : ''}
                </span>
              </span>
              <Pill tone={OUTPASS_TONE[o.status]}>{o.status}</Pill>
            </div>
          ))}
        <p className="mt-1 text-[11px] text-slate-500">To request an outpass, call the warden. Online requests come later.</p>
      </Card>
      <FeatureFooter ids={['HST-001', 'HST-002', 'HST-003', 'HST-008', 'HST-009']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

const ThemePreview: React.FC<{ choice: ThemeChoice }> = ({ choice }) => {
  const previews = choice === 'system' ? (['light', 'dark'] as const) : ([resolveTheme(choice, false)] as const);
  return (
    <span className="flex w-full h-20 rounded-lg overflow-hidden border border-slate-200" aria-hidden="true">
      {previews.map(t => (
        <span key={t} data-app-theme={t} className="flex-1 flex flex-col bg-[var(--app-bg)]" style={{ ['--accent' as string]: '#0e5d84' }}>
          <span className="h-4 bg-[var(--bar)] border-b-2 border-[var(--bar-edge)]" />
          <span className="m-1.5 flex-1 rounded-md bg-[var(--surface)] border border-slate-200 p-1 space-y-1">
            <span className="block h-1.5 w-2/3 rounded bg-slate-300" />
            <span className="block h-1.5 w-1/2 rounded bg-slate-200" />
            <span className="block h-2 w-1/3 rounded bg-[var(--accent)]" />
          </span>
        </span>
      ))}
    </span>
  );
};

export const AppearancePage: React.FC<{ onSaved: (text: string) => void }> = ({ onSaved }) => {
  const { choice, applied, setTheme } = useTheme();
  return (
    <Screen>
      <Card title="Theme">
        <p className="text-[12px] text-slate-500 -mt-1 mb-3">Choose your preferred appearance.</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map(o => {
            const on = o.id === choice;
            return (
              <button
                key={o.id}
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setTheme(o.id);
                  onSaved(`Theme set to ${o.label}`);
                }}
                className={cx('rounded-2xl border-2 p-2 text-left space-y-2 transition-colors', on ? 'border-[var(--accent-ink)] bg-slate-50' : 'border-slate-200')}
                data-theme-option={o.id}
              >
                <ThemePreview choice={o.id} />
                <span className="flex items-center gap-1.5">
                  <Icon name={o.icon} className="text-[18px] text-[var(--accent-ink)]" />
                  <span className="text-[13px] font-semibold text-slate-900 flex-1">{o.label}</span>
                  {on && <Icon name="check_circle" filled className="text-[18px] text-[var(--accent-ink)]" />}
                </span>
                <span className="block text-[11px] text-slate-500">{o.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-500" aria-live="polite">
          Showing the {applied === 'school' ? 'School' : applied === 'dark' ? 'Dark' : 'Light'} theme{choice === 'system' ? ', following your phone' : ''}. Saved on this device.
        </p>
      </Card>
      <FeatureFooter ids={['APP-015', 'APP-017']} />
    </Screen>
  );
};
