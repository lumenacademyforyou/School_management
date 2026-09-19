// On-device store for the teacher app (local-first). Survives reloads and works offline;
// the outbox is pushed to the demo backend when the device is online.
import { useCallback, useEffect, useState } from 'react';
import { INITIAL_REGISTER, Mark, StatusCode, markKey } from '../../src/data/attendance';
import { INITIAL_ROSTER } from '../../src/data/students';
import { APP_TODAY, sectionOf } from '../shared/schoolData';
import { BackendState, MarkHistory, ServerMark, getBackend, nowStamp, serverMark, updateBackend } from '../shared/demoBackend';

export interface CachedMark {
  code: StatusCode;
  rev: number;
  reason?: string;
  by: string;
  at: string;
}

export interface OutboxEntry {
  studentId: string;
  code: StatusCode;
  reason?: string;
  arrivedAt?: string;
  baseRev: number;
}

export interface OutboxItem {
  id: string;
  section: string;
  date: string;
  savedAt: string;
  entries: OutboxEntry[];
}

export interface Conflict {
  key: string;
  studentId: string;
  mine: OutboxEntry & { savedAt: string };
  theirs: ServerMark;
}

export interface DeviceState {
  online: boolean;
  snapshotAt: string;
  snapshot: Record<string, CachedMark>;
  outbox: OutboxItem[];
  conflicts: Conflict[];
  lastSync?: string;
}

const deviceKey = (teacherId: string) => `lumen-teacher-device-${teacherId}`;

/** The device last synced at 08:55, before the office changed any of today's marks. */
export const initialDevice = (): DeviceState => {
  const snapshot: Record<string, CachedMark> = {};
  INITIAL_ROSTER.forEach(s => {
    const key = markKey(s.id, APP_TODAY);
    const m = INITIAL_REGISTER[key];
    if (m) snapshot[key] = { code: m.code, rev: 1, reason: m.reason, by: m.markedBy, at: m.markedAt };
  });
  return { online: true, snapshotAt: '08:55', snapshot, outbox: [], conflicts: [] };
};

const readDevice = (teacherId: string): DeviceState => {
  try {
    const raw = window.localStorage.getItem(deviceKey(teacherId));
    if (raw) return JSON.parse(raw) as DeviceState;
  } catch {
    // fall through to a fresh device
  }
  return initialDevice();
};

export const useDevice = (teacherId: string) => {
  const [device, setDevice] = useState<DeviceState>(() => readDevice(teacherId));
  useEffect(() => {
    try {
      window.localStorage.setItem(deviceKey(teacherId), JSON.stringify(device));
    } catch {
      // memory only
    }
  }, [device, teacherId]);
  const reset = useCallback(() => setDevice(initialDevice()), []);
  return { device, setDevice, reset };
};

const applyWrite = (s: BackendState, key: string, mark: Mark, rev: number, note?: string): BackendState => {
  const history: MarkHistory = { key, rev, code: mark.code, by: mark.markedBy, at: mark.markedAt, source: 'Teacher app', note };
  return { ...s, marks: { ...s.marks, [key]: { ...mark, rev, source: 'Teacher app' } }, markHistory: [...s.markHistory, history] };
};

/**
 * ATT-005 / ATT-006: push queued attendance. A cell that someone else changed since the device last saw it
 * (server revision newer than the entry's base revision, with a different value) becomes a conflict for the
 * teacher to resolve; everything else is written. Nothing is silently overwritten.
 */
export const syncOutbox = (device: DeviceState, teacher: string): { device: DeviceState; written: number; conflicts: number } => {
  let written = 0;
  const conflicts: Conflict[] = [...device.conflicts];
  const snapshot = { ...device.snapshot };
  const time = nowStamp().slice(11);
  device.outbox.forEach(item => {
    item.entries.forEach(entry => {
      const key = markKey(entry.studentId, item.date);
      const server = serverMark(getBackend(), key);
      const serverRev = server?.rev ?? 0;
      if (server && serverRev > entry.baseRev && server.code !== entry.code) {
        conflicts.push({ key, studentId: entry.studentId, mine: { ...entry, savedAt: item.savedAt }, theirs: server });
        snapshot[key] = { code: server.code, rev: serverRev, reason: server.reason, by: server.markedBy, at: server.markedAt };
        return;
      }
      if (server && server.code === entry.code && (server.reason ?? '') === (entry.reason ?? '')) {
        snapshot[key] = { code: server.code, rev: serverRev, reason: server.reason, by: server.markedBy, at: server.markedAt };
        return;
      }
      const mark: Mark = { code: entry.code, reason: entry.reason, arrivedAt: entry.arrivedAt, markedBy: teacher, markedAt: item.savedAt.slice(11) };
      updateBackend(s => applyWrite(s, key, mark, serverRev + 1));
      snapshot[key] = { code: entry.code, rev: serverRev + 1, reason: entry.reason, by: teacher, at: mark.markedAt };
      written += 1;
    });
  });
  return { device: { ...device, outbox: [], conflicts, snapshot, lastSync: time, snapshotAt: time }, written, conflicts: conflicts.length - device.conflicts.length };
};

export const resolveConflict = (device: DeviceState, conflict: Conflict, keepMine: boolean, teacher: string): DeviceState => {
  const snapshot = { ...device.snapshot };
  if (keepMine) {
    const server = serverMark(getBackend(), conflict.key);
    const rev = (server?.rev ?? 0) + 1;
    const mark: Mark = { code: conflict.mine.code, reason: conflict.mine.reason, arrivedAt: conflict.mine.arrivedAt, markedBy: teacher, markedAt: nowStamp().slice(11) };
    updateBackend(s => applyWrite(s, conflict.key, mark, rev, `Replaced ${conflict.theirs.code} set by ${conflict.theirs.markedBy}; both versions kept`));
    snapshot[conflict.key] = { code: mark.code, rev, reason: mark.reason, by: teacher, at: mark.markedAt };
  } else {
    updateBackend(s => ({
      ...s,
      markHistory: [...s.markHistory, { key: conflict.key, rev: conflict.theirs.rev, code: conflict.theirs.code, by: teacher, at: nowStamp().slice(11), source: 'Teacher app', note: `Kept ${conflict.theirs.markedBy}'s value; discarded device value ${conflict.mine.code}` }],
    }));
  }
  return { ...device, snapshot, conflicts: device.conflicts.filter(c => c.key !== conflict.key) };
};

/** Pull the latest server values for a section into the device cache. */
export const refreshSnapshot = (device: DeviceState, section: string, date: string): DeviceState => {
  const snapshot = { ...device.snapshot };
  const backend = getBackend();
  INITIAL_ROSTER.filter(s => sectionOf(s) === section).forEach(s => {
    const key = markKey(s.id, date);
    const m = serverMark(backend, key);
    if (m) snapshot[key] = { code: m.code, rev: m.rev, reason: m.reason, by: m.markedBy, at: m.markedAt };
  });
  return { ...device, snapshot, snapshotAt: nowStamp().slice(11) };
};
