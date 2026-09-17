import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SMS_LAYERS, SMS_MODULES, RAW_FEATURES_SPEC, TOTAL_SPEC_STATS, SMSModule } from '../../data/featureCatalog';
import { AdminView } from '../../types';
import { PARENT_APP_URL, canView } from '../../data/staffAccess';
import { FEATURE_COVERAGE } from '../../data/featureCoverageScan';

type CoverageStatus = 'On screen' | 'Deferred' | 'Not built';
const coverageOf = (code: string): CoverageStatus => FEATURE_COVERAGE.get(code) ?? 'Not built';
const COVERAGE_STYLE: Record<CoverageStatus, string> = {
  'On screen': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Deferred: 'bg-amber-50 text-amber-700 border-amber-200',
  'Not built': 'bg-slate-100 text-slate-600 border-slate-200',
};

export const FeatureMasterView: React.FC = () => {
  const { setAdminView, addToast, currentUser } = useApp();
  /** Opens a module's screen: the parent app lives outside the console; other screens respect role allotment. */
  const openModule = (mod?: SMSModule) => {
    if (!mod) return;
    if (mod.targetView === 'parent-app') {
      window.open(PARENT_APP_URL, '_blank', 'noopener');
      return;
    }
    if (!canView(currentUser.staffRole, mod.targetView as AdminView)) {
      addToast(`${mod.name} is not allotted to your role`, 'warning');
      return;
    }
    setAdminView(mod.targetView as AdminView);
  };
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');
  const [selectedModule, setSelectedModule] = useState<string | 'all'>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverage, setSelectedCoverage] = useState<'all' | CoverageStatus>('all');
  const [activeTab, setActiveTab] = useState<'matrix' | 'modules' | 'stats'>('matrix');

  const filteredFeatures = useMemo(() => {
    return RAW_FEATURES_SPEC.filter(feat => {
      const parentMod = SMS_MODULES.find(m => m.code === feat.module);
      if (selectedLayer !== 'all' && parentMod?.layer !== selectedLayer) return false;
      if (selectedModule !== 'all' && feat.module !== selectedModule) return false;
      if (selectedPhase !== 'all' && feat.phase !== selectedPhase && !feat.phase.includes(selectedPhase)) return false;
      if (selectedPriority !== 'all' && feat.priority !== selectedPriority) return false;
      if (selectedCoverage !== 'all' && coverageOf(feat.code) !== selectedCoverage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          feat.code.toLowerCase().includes(q) ||
          feat.name.toLowerCase().includes(q) ||
          feat.desc.toLowerCase().includes(q) ||
          (parentMod?.name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedLayer, selectedModule, selectedPhase, selectedPriority, selectedCoverage, searchQuery]);

  const coverageCounts = useMemo(() => {
    const counts: Record<CoverageStatus, number> = { 'On screen': 0, Deferred: 0, 'Not built': 0 };
    RAW_FEATURES_SPEC.forEach(f => counts[coverageOf(f.code)]++);
    return counts;
  }, []);

  const handleExportCSV = () => {
    const headers = ['Code', 'Module', 'Name', 'Phase', 'Priority', 'Status', 'Description'];
    const rows = filteredFeatures.map(f => [
      f.code,
      f.module,
      `"${f.name.replace(/"/g, '""')}"`,
      f.phase,
      f.priority,
      coverageOf(f.code),
      `"${f.desc.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LMN-SMS-FEAT-001_Filtered_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported filtered specification to CSV', 'success');
  };

  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'P1':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'P2':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'P3':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'P4':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'M':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'S':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'C':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Spec Banner */}
      <div className="bg-gradient-to-r from-[#082b3d] via-[#0e5d84] to-[#166d99] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-[#213145]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#bae6fd] uppercase mb-1">
              <span className="px-2 py-0.5 rounded bg-white/10 font-bold">LMN-SMS-FEAT-001</span>
              <span>•</span>
              <span>v1.0 Standard</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">15 Sep 2026</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
              LumenAcademy Master Feature Specification
            </h1>
            <p className="text-xs md:text-sm text-[#e0f2fe] max-w-3xl mt-1">
              Complete architectural catalog covering all 6 core platform layers, 37 functional modules, and 699 enterprise capabilities for K-12 school administration.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setSelectedLayer('all');
                setSelectedModule('all');
                setSelectedPhase('all');
                setSelectedPriority('all');
                setSearchQuery('');
                addToast('All specification filters reset', 'info');
              }}
              className="px-3.5 py-2 bg-white text-[#0e5d84] hover:bg-[#f0f7fb] rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 4 Phase Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/15 text-xs">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <div className="text-[#bae6fd] font-semibold text-[11px]">Phase P1 — MVP</div>
            <div className="text-xl font-bold font-mono mt-0.5">{TOTAL_SPEC_STATS.p1Mvp} Features</div>
            <div className="text-[10px] text-emerald-300">Foundation & Daily Ops</div>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <div className="text-[#bae6fd] font-semibold text-[11px]">Phase P2 — Academic Depth</div>
            <div className="text-xl font-bold font-mono mt-0.5">{TOTAL_SPEC_STATS.p2Academic} Features</div>
            <div className="text-[10px] text-blue-300">Curriculum & Examinations</div>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <div className="text-[#bae6fd] font-semibold text-[11px]">Phase P3 — Operations & Offline</div>
            <div className="text-xl font-bold font-mono mt-0.5">{TOTAL_SPEC_STATS.p3Operations} Features</div>
            <div className="text-[10px] text-cyan-200">Fleet, Library, Hostel, Payroll</div>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
            <div className="text-[#bae6fd] font-semibold text-[11px]">Phase P4 — Compliance & Intelligence</div>
            <div className="text-xl font-bold font-mono mt-0.5">{TOTAL_SPEC_STATS.p4Compliance} Features</div>
            <div className="text-[10px] text-amber-300">DPDPA 2023, UDISE+, AI NLP</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#e0ecf4] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#464555] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">table_view</span>
            <span>Feature Master Matrix ({filteredFeatures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'modules'
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#464555] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">category</span>
            <span>{TOTAL_SPEC_STATS.totalModules} Modules Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-[#0e5d84] text-white shadow-xs'
                : 'text-[#464555] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">query_stats</span>
            <span>Coverage & Priority Stats</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#777587]">
          <span>{TOTAL_SPEC_STATS.totalFeatures} total spec capabilities</span>
          <span>•</span>
          <span className="text-emerald-700 font-bold">100% System Scoped</span>
        </div>
      </div>

      {/* Tab 1: Master Matrix View */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Layer Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#777587] uppercase mb-1">Layer</label>
                <select
                  value={selectedLayer}
                  onChange={e => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedLayer(val);
                    setSelectedModule('all');
                  }}
                  className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-2.5 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                >
                  <option value="all">All 5 Layers (Full System)</option>
                  {SMS_LAYERS.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Module Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#777587] uppercase mb-1">Module (35)</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-2.5 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                >
                  <option value="all">All 35 Modules</option>
                  {SMS_MODULES.filter(m => selectedLayer === 'all' || m.layer === selectedLayer).map(m => (
                    <option key={m.code} value={m.code}>
                      {m.number}. {m.name} ({m.code} · {m.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phase Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#777587] uppercase mb-1">Phase</label>
                <select
                  value={selectedPhase}
                  onChange={e => setSelectedPhase(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-2.5 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                >
                  <option value="all">All Phases</option>
                  <option value="P1">Phase P1 (MVP)</option>
                  <option value="P2">Phase P2 (Academic Depth)</option>
                  <option value="P3">Phase P3 (Operations & Offline)</option>
                  <option value="P4">Phase P4 (Compliance & Intelligence)</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#777587] uppercase mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl px-2.5 py-2 text-xs text-[#082b3d] focus:outline-hidden focus:border-[#0e5d84]"
                >
                  <option value="all">All Priorities</option>
                  <option value="M">M — Must Have (Core SLA)</option>
                  <option value="S">S — Should Have (Operational)</option>
                  <option value="C">C — Could Have (Advanced)</option>
                </select>
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-[11px] font-bold text-[#777587] uppercase mb-1">Quick Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#777587]">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search ${RAW_FEATURES_SPEC.length} items...`}
                    className="w-full bg-[#f8f9ff] border border-[#e0ecf4] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#082b3d] placeholder-[#777587] focus:outline-hidden focus:border-[#0e5d84]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Layer Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#f1f5f9]">
              <span className="text-[10px] font-bold text-[#777587] uppercase mr-1">Jump to Layer:</span>
              <button
                onClick={() => { setSelectedLayer('all'); setSelectedModule('all'); }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedLayer === 'all' ? 'bg-[#0e5d84] text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({RAW_FEATURES_SPEC.length})
              </button>
              {SMS_LAYERS.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setSelectedLayer(l.id); setSelectedModule('all'); }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedLayer === l.id ? 'bg-[#0e5d84] text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  L{l.id}: {l.shortName} ({l.featuresCount})
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-3 bg-[#f8f9ff] border-b border-[#e0ecf4] flex items-center justify-between text-xs font-semibold text-[#464555]">
              <span>Showing {filteredFeatures.length} matching features</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-[#777587] mr-1">
                  {RAW_FEATURES_SPEC.length} of {TOTAL_SPEC_STATS.totalFeatures} catalogue rows loaded ·
                </span>
                {(['all', 'On screen', 'Deferred', 'Not built'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCoverage(c)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      selectedCoverage === c ? 'bg-[#0e5d84] text-white border-[#0e5d84]' : c === 'all' ? 'bg-white text-[#464555] border-[#e0ecf4]' : COVERAGE_STYLE[c]
                    }`}
                  >
                    {c === 'all' ? 'All statuses' : `${c} · ${coverageCounts[c]}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[#464555] border-b border-[#e0ecf4] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-28">Code</th>
                    <th className="py-3 px-4 w-48">Module</th>
                    <th className="py-3 px-4">Feature Name</th>
                    <th className="py-3 px-3 w-24 text-center">Phase</th>
                    <th className="py-3 px-3 w-20 text-center">Priority</th>
                    <th className="py-3 px-3 w-24 text-center">Status</th>
                    <th className="py-3 px-4 w-36">Layer</th>
                    <th className="py-3 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredFeatures.map(feat => {
                    const mod = SMS_MODULES.find(m => m.code === feat.module);
                    return (
                      <tr key={feat.code} className="hover:bg-[#f8faff] transition-colors group">
                        {/* Code */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0e5d84]">
                          {feat.code}
                        </td>
                        {/* Module */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#082b3d]">
                            {mod?.name || feat.module}
                          </div>
                          <div className="text-[10px] text-[#777587]">
                            Module {mod?.number || feat.module}
                          </div>
                        </td>
                        {/* Feature Name & Desc */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#082b3d] group-hover:text-[#0e5d84] transition-colors">
                            {feat.name}
                          </div>
                          <div className="text-[11px] text-[#464555] mt-0.5 line-clamp-1">
                            {feat.desc || <span className="italic text-[#94a3b8]">Description pending — name, phase and priority from the PDF feature list</span>}
                          </div>
                        </td>
                        {/* Phase */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-mono border ${getPhaseBadge(feat.phase)}`}>
                            {feat.phase}
                          </span>
                        </td>
                        {/* Priority */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border ${getPriorityBadge(feat.priority)}`}>
                            {feat.priority === 'M' ? 'Must' : feat.priority === 'S' ? 'Should' : 'Could'}
                          </span>
                        </td>
                        {/* Coverage */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border whitespace-nowrap ${COVERAGE_STYLE[coverageOf(feat.code)]}`}>
                            {coverageOf(feat.code)}
                          </span>
                        </td>
                        {/* Layer */}
                        <td className="py-3 px-4 text-[#777587] text-[11px]">
                          <span className="font-medium text-[#082b3d]">Layer {mod?.layer}</span>
                          <div className="text-[10px] text-[#94a3b8]">{mod?.layerName}</div>
                        </td>
                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openModule(mod)}
                            className="text-xs bg-[#f0f7fb] hover:bg-[#0e5d84] text-[#0e5d84] hover:text-white px-2.5 py-1 rounded-lg font-semibold transition-all shadow-2xs"
                          >
                            Open →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 35 Modules Directory */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {SMS_LAYERS.map(layer => {
            const layerMods = SMS_MODULES.filter(m => m.layer === layer.id);
            return (
              <div key={layer.id} className="bg-white rounded-2xl border border-[#e0ecf4] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#082b3d] flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#0e5d84]"></span>
                      <span>{layer.name}</span>
                    </h3>
                    <p className="text-xs text-[#777587] mt-0.5">
                      {layer.modulesCount} modules • {layer.featuresCount} verified capabilities
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-[#f0f7fb] text-[#0e5d84] px-2.5 py-1 rounded-lg font-bold">
                    Layer {layer.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {layerMods.map(mod => (
                    <div
                      key={mod.code}
                      onClick={() => openModule(mod)}
                      className="p-3.5 rounded-xl border border-[#e0ecf4] hover:border-[#0e5d84] hover:shadow-xs transition-all cursor-pointer group bg-[#fdfefe] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#0e5d84] bg-[#f0f7fb] px-2 py-0.5 rounded">
                            {mod.number}. {mod.code}
                          </span>
                          <span className="text-[11px] font-semibold text-[#777587]">
                            {mod.count} Features
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#082b3d] group-hover:text-[#0e5d84] transition-colors mt-2">
                          {mod.name}
                        </h4>
                        <p className="text-xs text-[#464555] mt-1 line-clamp-2">
                          {mod.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span>Active Module</span>
                        </span>
                        <span className="text-[#0e5d84] font-bold group-hover:translate-x-0.5 transition-transform">
                          Launch View →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Stats & Coverage Summary */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#082b3d] uppercase tracking-wider">Features by Phase</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Phase P1 — MVP</span>
                  <span className="font-mono">{TOTAL_SPEC_STATS.p1Mvp} (35%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[35%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Phase P2 — Academic Depth</span>
                  <span className="font-mono">{TOTAL_SPEC_STATS.p2Academic} (29%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[29%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Phase P3 — Operations & Offline</span>
                  <span className="font-mono">{TOTAL_SPEC_STATS.p3Operations} (23%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[23%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Phase P4 — Compliance & Intelligence</span>
                  <span className="font-mono">{TOTAL_SPEC_STATS.p4Compliance} (13%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full w-[13%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#082b3d] uppercase tracking-wider">Priority Distribution</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-[11px] font-bold text-rose-800 uppercase">Must Have (M)</div>
                <div className="text-xl font-bold font-mono text-rose-950 mt-0.5">{TOTAL_SPEC_STATS.mustHave} Features</div>
                <div className="text-[10px] text-rose-700 mt-0.5">Non-negotiable core statutory & operational requirements</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-[11px] font-bold text-amber-800 uppercase">Should Have (S)</div>
                <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{TOTAL_SPEC_STATS.shouldHave} Features</div>
                <div className="text-[10px] text-amber-700 mt-0.5">High-efficiency automation & multi-channel routing</div>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                <div className="text-[11px] font-bold text-teal-800 uppercase">Could Have (C)</div>
                <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">{TOTAL_SPEC_STATS.couldHave} Features</div>
                <div className="text-[10px] text-teal-700 mt-0.5">Advanced AI NLP, dedicated DB tier, & video conf</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#082b3d] uppercase tracking-wider">Compliance & Regulatory Bindings</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-[#082b3d]">Indian DPDPA 2023</div>
                <div className="text-[11px] text-[#464555]">Digital Personal Data Protection Act consent, right to be forgotten, and breach notification</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-[#082b3d]">UDISE+ & APAAR Registry</div>
                <div className="text-[11px] text-[#464555]">Ministry of Education National PEN and One Nation One Student ID synchronization</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-[#082b3d]">TRAI DLT SMS & Telecom</div>
                <div className="text-[11px] text-[#464555]">Principal Entity registered template validation and header compliance</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-[#082b3d]">AIS-140 GPS Telematics</div>
                <div className="text-[11px] text-[#464555]">Ministry of Road Transport & Highways certified fleet vehicle safety standards</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
