import React from 'react';
import { useApp } from '../../context/AppContext';
import { BUS_ROUTE_14 } from '../../data/mockData';

export const DriverHeader: React.FC = () => {
  const { advanceDriverStop, sosActive, triggerSos, logout } = useApp();

  return (
    <div className="bg-[#082b3d] text-white px-4 py-2.5 sticky top-0 z-30 shadow-md flex items-center justify-between border-b border-[#213145]">
      <div className="flex items-center gap-3">
        <img
          src="/lumen-academy-logo.svg"
          alt="Lumen Academy"
          referrerPolicy="no-referrer"
          className="w-9 h-9 object-contain shrink-0 drop-shadow-xs hidden xs:block"
        />
        <div className="w-9 h-9 rounded-lg bg-[#152438] border border-[#2c3e55] flex items-center justify-center text-[#f59e0b]">
          <span className="material-symbols-outlined text-2xl">directions_bus</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white">{BUS_ROUTE_14.vehicleNumber}</h1>
            <span className="bg-[#0e5d84] text-[#d0ebf8] text-[10px] font-bold px-1.5 py-0.5 rounded">
              {BUS_ROUTE_14.routeNumber}
            </span>
          </div>
          <div className="text-[11px] text-[#cbdbf5] flex items-center gap-2">
            <span>Pilot: {BUS_ROUTE_14.driverName}</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Speed: {BUS_ROUTE_14.speedKmh} km/h</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={advanceDriverStop}
          className="flex items-center gap-1 bg-[#1e293b] hover:bg-[#334155] text-[#f59e0b] text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#334155] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">flag</span>
          <span className="hidden sm:inline">Advance Stop</span>
        </button>

        <button
          onClick={() => triggerSos(!sosActive)}
          className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all ${
            sosActive
              ? 'bg-white text-rose-600 animate-pulse ring-2 ring-rose-500'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">emergency</span>
          <span>{sosActive ? 'SOS ACTIVE (TAP CLEAR)' : 'EMERGENCY SOS'}</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1 bg-white/10 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/20 transition-colors"
          title="Sign Out to Login Page"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
};
