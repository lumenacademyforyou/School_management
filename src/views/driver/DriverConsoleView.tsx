import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BUS_ROUTE_14 } from '../../data/mockData';

export const DriverConsoleView: React.FC = () => {
  const {
    driverView,
    driverCurrentStopIndex,
    advanceDriverStop,
    sosActive,
    triggerSos,
    addToast,
  } = useApp();

  const currentStop = BUS_ROUTE_14.stops[driverCurrentStopIndex] || BUS_ROUTE_14.stops[0];

  // Inspection state
  const [inspectionItems, setInspectionItems] = useState([
    { id: 'gps', label: 'AIS-140 Certified GPS Tracker & Panic Button Powered', checked: true },
    { id: 'camera', label: 'CCTV In-Cabin & Front Road Dual Camera Online', checked: true },
    { id: 'firstaid', label: 'First Aid Kit Verified & Stocked', checked: true },
    { id: 'fire', label: 'Fire Extinguisher Pressure Gauge in Green Zone', checked: true },
    { id: 'speed', label: 'Speed Governor Calibrated (40 km/h School Zone Cap)', checked: true },
    { id: 'emergency', label: 'Rear Emergency Door Lock Released & Operational', checked: true },
    { id: 'tyres', label: 'Tyre Pressure & Tread Depth Inspected', checked: false },
  ]);

  const toggleInspection = (id: string) => {
    setInspectionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    addToast('Inspection item updated', 'info');
  };

  const handleCompleteInspection = () => {
    const allDone = inspectionItems.every(i => i.checked);
    if (allDone) {
      addToast('AIS-140 Daily Fitness Inspection signed & submitted', 'success', 'Bus #12 approved for passenger transit.');
    } else {
      addToast('Please complete all 7 pre-trip safety checks', 'warning');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Driver HUD Header */}
      <div className="bg-[#082b3d] text-white p-5 md:p-6 rounded-2xl border border-[#213145] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
            alt="G. Murugan"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#f59e0b]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold font-display">{BUS_ROUTE_14.driverName}</h1>
              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-xs px-2 py-0.5 rounded font-mono font-bold">
                PILOT-012
              </span>
            </div>
            <div className="text-xs text-[#cbd5e1] mt-0.5">
              Bus #12 ({BUS_ROUTE_14.vehicleNumber}) • Route #14 (Velachery Express)
            </div>
            <div className="text-xs text-[#f59e0b] mt-1 font-mono font-bold flex items-center gap-2">
              <span>SPEED: {BUS_ROUTE_14.speedKmh} KM/H (LIMIT 40)</span>
              <span>•</span>
              <span>FUEL: 74%</span>
            </div>
          </div>
        </div>

        {/* Big Panic SOS Trigger */}
        <button
          type="button"
          onClick={() => triggerSos(!sosActive)}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            sosActive
              ? 'bg-rose-600 text-white animate-ping ring-4 ring-rose-300'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          <span className="material-symbols-outlined">emergency</span>
          <span>{sosActive ? 'SOS ACTIVE (DISPATCHED)' : 'PANIC SOS'}</span>
        </button>
      </div>

      {/* TAB 1: LIVE ROUTE */}
      {driverView === 'live-route' && (
        <div className="space-y-6">
          {/* Active Waypoint & Advance Trigger */}
          <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#777587] uppercase">Active Stop #{currentStop.stopNo} of {BUS_ROUTE_14.stops.length}</span>
              <span className="text-xs font-mono font-bold text-[#0e5d84] bg-[#f0f7fb] px-2 py-0.5 rounded">
                Scheduled: {currentStop.time}
              </span>
            </div>

            <div className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
              {currentStop.name}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#f0f7fb]">
              <div className="text-xs text-[#464555]">
                Expected Boardings: <strong>{currentStop.studentCount} Students</strong>
              </div>
              <button
                type="button"
                onClick={advanceDriverStop}
                className="w-full sm:w-auto bg-[#0e5d84] hover:bg-[#083a4f] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">flag</span>
                <span>Arrived & Advance Geofence</span>
              </button>
            </div>
          </div>

          {/* Route Progression Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
            <h2 className="text-xs font-bold text-[#082b3d] uppercase mb-4">Route #14 Stoppages Progress</h2>
            <div className="space-y-3">
              {BUS_ROUTE_14.stops.map((stop, idx) => {
                const isPassed = idx < driverCurrentStopIndex;
                const isCurrent = idx === driverCurrentStopIndex;
                return (
                  <div key={stop.stopNo} className="flex items-center gap-3 text-xs">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-[#0e5d84] text-white ring-4 ring-[#0e5d84]/20'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPassed ? <span className="material-symbols-outlined text-sm">check</span> : stop.stopNo}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className={`font-bold ${isCurrent ? 'text-[#0e5d84]' : 'text-[#082b3d]'}`}>
                          {stop.name}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[#777587] text-[11px]">{stop.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT ROSTER */}
      {driverView === 'student-roster' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex items-center justify-between">
            <span className="text-xs font-bold text-[#082b3d]">Route #14 Passenger RFID Manifest</span>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              35 / 35 ALLOTTED
            </span>
          </div>

          <div className="divide-y divide-[#f0f7fb] text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#0e5d84]">12B</span>
                <div>
                  <div className="font-bold text-[#082b3d]">Aarav S. Ramanathan (Class 10-A)</div>
                  <div className="text-[10px] text-[#777587]">Stop: Velachery Bypass • Guardian: +91 98401 23456</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  RFID Tapped In (07:44 AM)
                </span>
                <button
                  type="button"
                  onClick={() => addToast('Calling parent: +91 98401 23456', 'info')}
                  className="p-1.5 text-[#0e5d84] hover:bg-[#f0f7fb] rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#0e5d84]">14A</span>
                <div>
                  <div className="font-bold text-[#082b3d]">Farah N. Siddiqui (Class 10-A)</div>
                  <div className="text-[10px] text-[#777587]">Stop: Madipakkam Lake View • Guardian: +91 98405 67890</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  RFID Tapped In (07:42 AM)
                </span>
                <button
                  type="button"
                  onClick={() => addToast('Calling parent: +91 98405 67890', 'info')}
                  className="p-1.5 text-[#0e5d84] hover:bg-[#f0f7fb] rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#777587]">18C</span>
                <div>
                  <div className="font-bold text-[#082b3d]">Advait C. Joshi (Class 9-B)</div>
                  <div className="text-[10px] text-[#777587]">Stop: Medavakkam Junction • Guardian: +91 98409 11223</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  Boarding at Next Stop
                </span>
                <button
                  type="button"
                  onClick={() => addToast('Calling parent: +91 98409 11223', 'info')}
                  className="p-1.5 text-[#0e5d84] hover:bg-[#f0f7fb] rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE INSPECTION */}
      {driverView === 'vehicle-inspection' && (
        <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#082b3d]">AIS-140 Daily Pre-Trip Safety Checklist</h2>
              <div className="text-xs text-[#777587]">Vehicle: TN-09-CB-4491 • Inspector: Pilot G. Murugan</div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
              Statutory Form RTO-04
            </span>
          </div>

          <div className="space-y-2.5">
            {inspectionItems.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#e0ecf4] hover:bg-[#f8f9ff] cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleInspection(item.id)}
                  className="w-4 h-4 rounded text-[#0e5d84] focus:ring-[#0e5d84]"
                />
                <span className={`font-medium ${item.checked ? 'text-[#082b3d]' : 'text-[#777587]'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className="pt-3 border-t border-[#f0f7fb] flex justify-end">
            <button
              type="button"
              onClick={handleCompleteInspection}
              className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign & Certify Pre-Trip Fitness
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SOS DISPATCH */}
      {driverView === 'sos-dispatch' && (
        <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
            <div>
              <h2 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">emergency</span>
                <span>Emergency Broadcast & Quick Dispatch</span>
              </h2>
              <div className="text-xs text-[#777587]">AIS-140 Panic Alarm Network & Police Gateway</div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                sosActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {sosActive ? 'ALERT TRANSMITTING' : 'STANDBY'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                triggerSos(true);
                addToast('Police Control Room (112) alerted with live vehicle coordinates', 'error');
              }}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-left transition-colors cursor-pointer space-y-1"
            >
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">local_police</span>
                <span>Dial Police Control (112)</span>
              </div>
              <p className="text-[11px] text-rose-700">Dispatches current coordinates to local traffic & PCR van.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerSos(true);
                addToast('Emergency Ambulance (108) requested to Velachery Bypass', 'error');
              }}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-left transition-colors cursor-pointer space-y-1"
            >
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">ambulance</span>
                <span>Medical Emergency (108)</span>
              </div>
              <p className="text-[11px] text-rose-700">Immediate medical dispatch for passenger accident or illness.</p>
            </button>

            <button
              type="button"
              onClick={() => addToast('Calling School Transport Desk: +91 44 2255 8800', 'info')}
              className="p-4 rounded-xl border border-[#cbe0ec] bg-[#f0f7fb] hover:bg-[#dbeafe] text-left transition-colors cursor-pointer space-y-1"
            >
              <div className="font-bold text-[#0e5d84] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">support_agent</span>
                <span>School Transport Desk</span>
              </div>
              <p className="text-[11px] text-[#464555]">Direct patch to Campus Fleet Operations Manager.</p>
            </button>

            <button
              type="button"
              onClick={() => addToast('Mechanical breakdown reported; recovery truck queued', 'warning')}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition-colors cursor-pointer space-y-1"
            >
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">car_repair</span>
                <span>Mechanical Breakdown</span>
              </div>
              <p className="text-[11px] text-amber-700">Request backup bus deployment and technician team.</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
