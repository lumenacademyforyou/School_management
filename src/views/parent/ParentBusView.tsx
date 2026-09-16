import React from 'react';
import { useApp } from '../../context/AppContext';
import { BUS_ROUTE_14 } from '../../data/mockData';

export const ParentBusView: React.FC = () => {
  const { driverCurrentStopIndex, addToast } = useApp();
  const currentStop = BUS_ROUTE_14.stops[driverCurrentStopIndex] || BUS_ROUTE_14.stops[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">satellite_alt</span>
            <span>AIS-140 Live GPS Telemetry</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            School Bus #12 Live Radar
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Registration: <strong>TN-07-BW-4821</strong> • Route #14 • Pilot: <strong>{BUS_ROUTE_14.driverName}</strong>
          </p>
        </div>

        <button
          onClick={() => addToast('Calling Driver G. Murugan at +91 98402 34567...', 'info')}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-sm">call</span>
          <span>Call Driver Murugan</span>
        </button>
      </div>

      {/* Transit Radar Map Graphic */}
      <div className="bg-[#082b3d] text-white p-6 rounded-2xl border border-[#213145] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#213145] pb-3">
          <div className="flex items-center gap-2 text-[#f59e0b] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE GPS TRACKING ACTIVE (Speed: {BUS_ROUTE_14.speedKmh} km/h)</span>
          </div>
          <span className="text-xs font-mono text-[#cbd5e1]">ETA to School: {BUS_ROUTE_14.etaSchool}</span>
        </div>

        <div className="h-44 bg-[#071321] rounded-xl border border-[#1e293b] relative flex items-center justify-center overflow-hidden">
          {/* Simulated radar rings */}
          <div className="absolute w-72 h-72 rounded-full border border-[#f59e0b]/10"></div>
          <div className="absolute w-44 h-44 rounded-full border border-[#f59e0b]/20"></div>
          
          <div className="text-center space-y-1 z-10">
            <div className="w-12 h-12 rounded-full bg-[#0e5d84] text-[#f59e0b] flex items-center justify-center mx-auto shadow-lg ring-4 ring-[#f59e0b]/30 animate-pulse">
              <span className="material-symbols-outlined text-2xl">directions_bus</span>
            </div>
            <div className="text-xs font-bold text-white mt-2">Current Location: {currentStop.name}</div>
            <div className="text-[11px] text-[#f59e0b]">Aarav is safely seated inside • RFID Seat 12B Verified</div>
          </div>
        </div>

        {/* Route Stops Progress */}
        <div className="space-y-2 pt-2">
          <div className="text-xs text-[#cbd5e1] font-semibold">Route Stops Sequence:</div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
            {BUS_ROUTE_14.stops.map((stop, idx) => {
              const isCleared = idx < driverCurrentStopIndex;
              const isNow = idx === driverCurrentStopIndex;
              return (
                <div
                  key={stop.stopNo}
                  className={`p-2 rounded-lg border text-center ${
                    isNow
                      ? 'bg-[#0e5d84] border-[#f59e0b] text-white font-bold'
                      : isCleared
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[9px] opacity-80">{stop.time}</div>
                  <div className="truncate">{stop.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
