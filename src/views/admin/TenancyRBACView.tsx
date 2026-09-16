import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campus } from '../../types';

interface RolePermissionRow {
  role: string;
  student360: string;
  financialLedger: string;
  digiLockerDsc: string;
  fleetGps: string;
  dpdpa: string;
}

export const TenancyRBACView: React.FC = () => {
  const { campuses, setCampuses, selectedCampus, setSelectedCampus, addToast } = useApp();
  const [jitElevated, setJitElevated] = useState(false);

  // Modals state
  const [showAddCampusModal, setShowAddCampusModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RolePermissionRow | null>(null);

  const [newCampus, setNewCampus] = useState({
    id: '',
    code: '',
    name: '',
    location: '',
    status: 'ACTIVE',
    studentsCount: 500,
    storageGb: 25,
  });

  const [rolesMatrix, setRolesMatrix] = useState<RolePermissionRow[]>([
    {
      role: 'Super Administrator (Trust)',
      student360: 'FULL (R/W)',
      financialLedger: 'FULL (R/W)',
      digiLockerDsc: 'DSC SIGN',
      fleetGps: 'FULL (R/W)',
      dpdpa: 'DPO AUDIT',
    },
    {
      role: 'Campus Principal',
      student360: 'FULL (R/W)',
      financialLedger: 'VIEW ONLY',
      digiLockerDsc: 'DSC SIGN',
      fleetGps: 'SUPERVISE',
      dpdpa: 'APPROVE',
    },
    {
      role: 'PGT / TGT Class Mentor',
      student360: 'CLASS SCOPED',
      financialLedger: 'NO ACCESS',
      digiLockerDsc: 'NO ACCESS',
      fleetGps: 'VIEW BUS',
      dpdpa: 'NO ACCESS',
    },
    {
      role: 'Fleet Supervisor / Driver',
      student360: 'NO ACCESS',
      financialLedger: 'NO ACCESS',
      digiLockerDsc: 'NO ACCESS',
      fleetGps: 'AIS-140 SOS',
      dpdpa: 'NO ACCESS',
    },
    {
      role: 'Bursar / Accounts Officer',
      student360: 'VIEW ONLY',
      financialLedger: 'FULL (R/W)',
      digiLockerDsc: 'NO ACCESS',
      fleetGps: 'NO ACCESS',
      dpdpa: 'NO ACCESS',
    },
  ]);

  const handleCreateCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampus.name.trim() || !newCampus.code.trim()) {
      addToast('Campus name and branch code are required', 'warning');
      return;
    }
    const created: Campus = {
      id: `campus-${Date.now()}`,
      name: newCampus.name.trim(),
      code: newCampus.code.trim().toUpperCase(),
      location: newCampus.location.trim(),
      affiliationNumber: 'Pending affiliation',
      academicYear: selectedCampus.academicYear,
      studentsCount: Number(newCampus.studentsCount) || 200,
      staffCount: 0,
      clusterId: selectedCampus.clusterId,
      storageGb: Number(newCampus.storageGb) || 20,
      status: 'Standby',
    };
    if (setCampuses) {
      setCampuses(prev => [...prev, created]);
    }
    setShowAddCampusModal(false);
    addToast(`Campus cluster ${created.name} (${created.code}) provisioned with isolated RLS partition`, 'success');
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setRolesMatrix(prev =>
      prev.map(r => (r.role === selectedRole.role ? selectedRole : r))
    );
    setShowEditRoleModal(false);
    addToast(`RBAC policy permissions updated for "${selectedRole.role}"`, 'success');
  };

  const handleExportRbac = () => {
    const csvContent = [
      'Role Designation,Student 360,Financial Ledger,CBSE DigiLocker DSC,Fleet GPS & SOS,Statutory DPDPA',
      ...rolesMatrix.map(
        r => `"${r.role}","${r.student360}","${r.financialLedger}","${r.digiLockerDsc}","${r.fleetGps}","${r.dpdpa}"`
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LumenAcademy_RBAC_Governance_Matrix_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported RBAC Governance Matrix (CSV)', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>Multi-Tenant Architecture & Enterprise RBAC</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Campus Cluster Topology & Granular Role Governance
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            {campuses.length} Campus Nodes • Row-Level Tenant Security • Just-In-Time (JIT) Elevation Protocol
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddCampusModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#082b3d] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_business</span>
            <span>Add Campus Node</span>
          </button>

          <button
            onClick={handleExportRbac}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#082b3d] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export RBAC Matrix</span>
          </button>

          <button
            onClick={() => {
              setJitElevated(!jitElevated);
              addToast(
                !jitElevated
                  ? 'JIT Temporary Elevation Granted for 15 mins (Audit Logged)'
                  : 'JIT Elevation Revoked',
                !jitElevated ? 'warning' : 'info'
              );
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors ${
              jitElevated
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-[#f0f7fb] text-[#0e5d84] border border-[#cbe0ec] hover:bg-[#e0ecf4]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">key</span>
            <span>{jitElevated ? 'JIT Elevation ACTIVE (14m)' : 'Request JIT Elevation'}</span>
          </button>
        </div>
      </div>

      {/* Campus Clusters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {campuses.map(c => (
          <div
            key={c.id}
            onClick={() => {
              setSelectedCampus(c);
              addToast(`Active tenant switched to ${c.name}`, 'info');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedCampus.id === c.id
                ? 'bg-[#f0f7fb] border-[#0e5d84] ring-2 ring-[#0e5d84]'
                : 'bg-white border-[#e0ecf4] hover:border-[#cbe0ec]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#777587] mb-1">
              <span className="font-bold text-[#0e5d84] font-mono">{c.code}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {c.status}
              </span>
            </div>
            <div className="text-sm font-bold text-[#082b3d]">{c.name}</div>
            <div className="text-[11px] text-[#464555] mt-1">{c.location}</div>
            <div className="mt-3 pt-2 border-t border-[#cbe0ec] text-xs flex justify-between font-medium">
              <span>{c.studentsCount} Students</span>
              <span className="font-mono text-[#777587]">{c.storageGb} GB DB</span>
            </div>
          </div>
        ))}
      </div>

      {/* Granular RBAC Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#082b3d] block">Institutional Role-Based Access Control (RBAC) Matrix</span>
            <span className="text-[11px] text-[#777587]">Click any role to edit authorization rules and verb privileges</span>
          </div>
          <span className="text-xs font-mono text-[#0e5d84] bg-white px-2 py-0.5 rounded border border-[#cbe0ec] self-start sm:self-auto">
            Least Privilege Policy Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f7fb]/60 text-[#464555] font-semibold border-b border-[#cbe0ec]">
              <tr>
                <th className="p-3">Role Designation</th>
                <th className="p-3 text-center">Student 360</th>
                <th className="p-3 text-center">Financial Ledger</th>
                <th className="p-3 text-center">CBSE DigiLocker DSC</th>
                <th className="p-3 text-center">Fleet GPS & SOS</th>
                <th className="p-3 text-center">Statutory DPDPA</th>
                <th className="p-3 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {rolesMatrix.map(r => (
                <tr key={r.role} className="hover:bg-[#f8faff] transition-colors">
                  <td className="p-3 font-bold text-[#082b3d]">{r.role}</td>
                  <td className="p-3 text-center">
                    <span className={r.student360.includes('FULL') ? 'text-emerald-600 font-bold' : r.student360.includes('CLASS') ? 'text-[#0e5d84] font-semibold' : 'text-slate-400'}>
                      {r.student360}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={r.financialLedger.includes('FULL') ? 'text-emerald-600 font-bold' : r.financialLedger.includes('VIEW') ? 'text-[#0e5d84] font-semibold' : 'text-slate-400'}>
                      {r.financialLedger}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={r.digiLockerDsc.includes('DSC') ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {r.digiLockerDsc}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={r.fleetGps.includes('FULL') || r.fleetGps.includes('AIS') ? 'text-emerald-600 font-bold' : r.fleetGps.includes('VIEW') || r.fleetGps.includes('SUPERVISE') ? 'text-[#0e5d84] font-semibold' : 'text-slate-400'}>
                      {r.fleetGps}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={r.dpdpa.includes('DPO') || r.dpdpa.includes('APPROVE') ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {r.dpdpa}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedRole({ ...r });
                        setShowEditRoleModal(true);
                      }}
                      className="text-[#0e5d84] hover:underline font-bold text-xs"
                    >
                      Edit Verbs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Campus Node */}
      {showAddCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <h3 className="font-bold text-base text-[#082b3d]">Add Campus Branch Node (TEN-002)</h3>
              <button onClick={() => setShowAddCampusModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCampus} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Campus Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LMN-BLR"
                    value={newCampus.code}
                    onChange={e => setNewCampus({ ...newCampus, code: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d] uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Initial Capacity</label>
                  <input
                    type="number"
                    value={newCampus.studentsCount}
                    onChange={e => setNewCampus({ ...newCampus, studentsCount: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Campus Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lumen Bengaluru South Campus"
                  value={newCampus.name}
                  onChange={e => setNewCampus({ ...newCampus, name: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Geographic Location</label>
                <input
                  type="text"
                  placeholder="e.g. Whitefield, Bengaluru, Karnataka"
                  value={newCampus.location}
                  onChange={e => setNewCampus({ ...newCampus, location: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAddCampusModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Provision Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role Verbs */}
      {showEditRoleModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Configure Role: {selectedRole.role}</h3>
                <span className="text-[11px] text-[#777587]">Module-level authorization verbs</span>
              </div>
              <button onClick={() => setShowEditRoleModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Student 360 Scope</label>
                <select
                  value={selectedRole.student360}
                  onChange={e => setSelectedRole({ ...selectedRole, student360: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs"
                >
                  <option value="FULL (R/W)">FULL (R/W)</option>
                  <option value="VIEW ONLY">VIEW ONLY</option>
                  <option value="CLASS SCOPED">CLASS SCOPED</option>
                  <option value="NO ACCESS">NO ACCESS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Financial Ledger Scope</label>
                <select
                  value={selectedRole.financialLedger}
                  onChange={e => setSelectedRole({ ...selectedRole, financialLedger: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs"
                >
                  <option value="FULL (R/W)">FULL (R/W)</option>
                  <option value="VIEW ONLY">VIEW ONLY</option>
                  <option value="NO ACCESS">NO ACCESS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">CBSE DigiLocker DSC Signature</label>
                <select
                  value={selectedRole.digiLockerDsc}
                  onChange={e => setSelectedRole({ ...selectedRole, digiLockerDsc: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs"
                >
                  <option value="DSC SIGN">DSC SIGN (Authorized Signatory)</option>
                  <option value="VIEW ONLY">VIEW ONLY</option>
                  <option value="NO ACCESS">NO ACCESS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Fleet GPS & SOS Permissions</label>
                <select
                  value={selectedRole.fleetGps}
                  onChange={e => setSelectedRole({ ...selectedRole, fleetGps: e.target.value })}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs"
                >
                  <option value="FULL (R/W)">FULL (R/W)</option>
                  <option value="SUPERVISE">SUPERVISE</option>
                  <option value="VIEW BUS">VIEW BUS</option>
                  <option value="AIS-140 SOS">AIS-140 SOS</option>
                  <option value="NO ACCESS">NO ACCESS</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowEditRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#2c1ea8] text-white rounded-xl font-bold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
