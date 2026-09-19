import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BUS_ROUTE_14 } from '../../data/mockData';
import { Figure } from '../../components/common/Figure';
import { Modal } from '../../components/common/ui';

export const TransportView: React.FC = () => {
  const {
    driverCurrentStopIndex,
    advanceDriverStop,
    sosActive,
    triggerSos,
    addToast,
  } = useApp();

  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('15');
  const [delayReason, setDelayReason] = useState('Guindy Flyover Traffic Congestion');

  const handleExportManifest = () => {
    const csvContent = [
      'Stop No,Stop Name,Scheduled Time,Student Count,Status',
      ...BUS_ROUTE_14.stops.map((s, idx) => {
        const isCompleted = idx < driverCurrentStopIndex;
        const isCurrent = idx === driverCurrentStopIndex;
        const status = isCompleted ? 'Cleared' : isCurrent ? 'Active' : 'Upcoming';
        return `${s.stopNo},"${s.name}","${s.time}",${s.studentCount},${status}`;
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Fleet_Manifest_Route14_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded Route 14 Fleet Manifest & Waypoint Schedule', 'success');
  };

  const handleBroadcastDelay = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDelayModal(false);
    addToast(`Broadcasted ${delayMinutes}-minute delay alert to all 35 parents on Route #14 via WhatsApp & SMS (TRN-018)`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">directions_bus</span>
            <span>AIS-140 Certified Fleet Command (TRN-001..028)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">
            Live Transit Radar: {BUS_ROUTE_14.routeNumber} ({BUS_ROUTE_14.vehicleNumber})
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Pilot: <strong>{BUS_ROUTE_14.driverName}</strong> • Conductor: {BUS_ROUTE_14.conductorName} • Speed: {BUS_ROUTE_14.speedKmh} km/h (Limit: 40 km/h)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportManifest}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Manifest</span>
          </button>
          <button
            onClick={() => setShowDelayModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">notification_important</span>
            <span>Delay Alert</span>
          </button>
          <button
            onClick={advanceDriverStop}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">flag</span>
            <span>Simulate Geofence Arrival</span>
          </button>
          <button
            onClick={() => triggerSos(!sosActive)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all ${
              sosActive
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>{sosActive ? 'EMERGENCY SOS ACTIVE' : 'Test Panic SOS'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Live GPS Speed</div>
          <div className="text-2xl font-bold font-mono text-ink mt-0.5">{BUS_ROUTE_14.speedKmh} km/h</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Under 40 km/h limit</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Destination ETA</div>
          <div className="text-2xl font-bold font-mono text-brand mt-0.5">{BUS_ROUTE_14.etaSchool}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">On Schedule (0 min delay)</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Diesel Tank Level</div>
          <div className="text-2xl font-bold font-mono text-ink mt-0.5"><Figure value="74" suffix="%" /></div>
          <div className="text-[11px] text-ink-soft">Est. Range: 310 km</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Passenger Manifest</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">35 / 35</div>
          <div className="text-[11px] text-emerald-700 font-semibold">All Boarded via RFID</div>
        </div>
      </div>

      {/* Live Route Waypoints Tracker */}
      <div className="bg-surface p-5 rounded-2xl border border-line-soft shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-brand text-base">alt_route</span>
          <span>Route #14 Transit Progress (Velachery - Guindy Corridor)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {BUS_ROUTE_14.stops.map((stop, idx) => {
            const isCompleted = idx < driverCurrentStopIndex;
            const isCurrent = idx === driverCurrentStopIndex;
            return (
              <div
                key={stop.stopNo}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-brand text-white border-brand shadow-md ring-2 ring-brand/30'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] opacity-80">
                  <span>Stop #{stop.stopNo}</span>
                  <span>{stop.time}</span>
                </div>
                <div className="font-bold text-xs mt-1 truncate">{stop.name}</div>
                <div className="text-[11px] mt-2 flex items-center justify-between font-medium">
                  <span>{stop.studentCount} Students</span>
                  <span>{isCompleted ? '✓ Cleared' : isCurrent ? '● Active' : 'Upcoming'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passenger Manifest Roster */}
      <div className="bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden">
        <div className="p-4 bg-subtle border-b border-line flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Route #14 Passenger RFID Tap Log</span>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
            AIS-140 IRNSS SYNCED
          </span>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-brand">Seat 12B</span>
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                alt="Aarav"
                className="w-8 h-8 rounded-full object-cover border border-line"
              />
              <div>
                <div className="font-bold text-ink">Aarav S. Ramanathan (Class 10-A)</div>
                <div className="text-[11px] text-ink-soft">Velachery Bypass • Guardian: Sundar Ramanathan (+91 98401 23456)</div>
              </div>
            </div>
            <span className="text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
              Boarded: 07:44:12 AM
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-brand">Seat 14A</span>
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                alt="Farah"
                className="w-8 h-8 rounded-full object-cover border border-line"
              />
              <div>
                <div className="font-bold text-ink">Farah N. Siddiqui (Class 10-A)</div>
                <div className="text-[11px] text-ink-soft">Madipakkam Lake View • Guardian: N. Siddiqui (+91 98405 67890)</div>
              </div>
            </div>
            <span className="text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
              Boarded: 07:42:08 AM
            </span>
          </div>
        </div>
      </div>

      {/* MODAL: Delay Broadcast */}
      <Modal open={showDelayModal} onClose={() => setShowDelayModal(false)} title="Broadcast Route Delay Alert (TRN-018)">
        <form onSubmit={handleBroadcastDelay} className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estimated Delay Duration (Minutes)</label>
            <select
              value={delayMinutes}
              onChange={e => setDelayMinutes(e.target.value)}
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
            >
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="25">25 Minutes</option>
              <option value="45">45 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Delay</label>
            <input
              type="text"
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
              placeholder="e.g. Heavy traffic or tyre puncture"
              className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            Will dispatch an instant push notification and SMS to all 35 parents assigned to Route 14 stops.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowDelayModal(false)}
              className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Send Delay Notification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
