import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface IntegrationService {
  id: string;
  code: string;
  name: string;
  category: 'Payments' | 'Messaging' | 'Hardware' | 'Government & Identity';
  provider: string;
  status: 'Connected' | 'Configured' | 'Standby';
  details: string;
  latencyOrQuota: string;
  apiKeyMasked?: string;
  endpoint?: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  created: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED';
}

export const IntegrationsView: React.FC = () => {
  const { addToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [webhookUrl, setWebhookUrl] = useState('https://erp.lumenacademy.edu.in/api/v1/events/webhook');

  // Modals
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);

  // New API Key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read:students', 'write:attendance']);
  const [newGeneratedSecret, setNewGeneratedSecret] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'Mobile Parent App Gateway',
      prefix: 'lmn_live_8f7b...9a12',
      created: '2026-08-12',
      scopes: ['read:students', 'read:fees', 'read:attendance'],
      status: 'ACTIVE',
    },
    {
      id: 'key-2',
      name: 'ZKTeco Biometric Sync Daemon',
      prefix: 'lmn_live_41a0...bc88',
      created: '2026-07-20',
      scopes: ['write:attendance', 'read:staff'],
      status: 'ACTIVE',
    },
    {
      id: 'key-3',
      name: 'AIS-140 GPS Telematics Ingestion',
      prefix: 'lmn_live_99ce...110f',
      created: '2026-06-05',
      scopes: ['write:transport_gps'],
      status: 'ACTIVE',
    },
  ]);

  const [integrations, setIntegrations] = useState<IntegrationService[]>([
    {
      id: 'INT-01',
      code: 'INT-001',
      name: 'Payment Gateway Aggregator',
      category: 'Payments',
      provider: 'Razorpay & HDFC SmartHub',
      status: 'Connected',
      details: 'Instant settlement via virtual accounts & UPI autopay recurring mandates',
      latencyOrQuota: '99.98% Success Rate',
      endpoint: 'https://api.razorpay.com/v1/virtual_accounts',
    },
    {
      id: 'INT-02',
      code: 'INT-002',
      name: 'UPI Autopay & e-Mandate',
      category: 'Payments',
      provider: 'NPCI / Razorpay Mandate API',
      status: 'Connected',
      details: 'Automatic quarterly school tuition fee debit authorization with parent OTP',
      latencyOrQuota: '1,240 Active Mandates',
      endpoint: 'https://api.razorpay.com/v1/subscriptions',
    },
    {
      id: 'INT-03',
      code: 'INT-003',
      name: 'WhatsApp Business API',
      category: 'Messaging',
      provider: 'Meta Cloud API Direct Partner',
      status: 'Connected',
      details: 'High-speed fee receipts, bus delay alerts, and exam report cards dispatch',
      latencyOrQuota: '14,200 msg / day',
      endpoint: 'https://graph.facebook.com/v19.0/messages',
    },
    {
      id: 'INT-04',
      code: 'INT-004',
      name: 'TRAI DLT SMS Gateway',
      category: 'Messaging',
      provider: 'Airtel Enterprise DLT (PE ID: 1701159...)',
      status: 'Connected',
      details: 'Approved sender IDs: LMNACD, LMNSMS with mandatory entity hash checks',
      latencyOrQuota: 'Instant (< 3s SLA)',
      endpoint: 'https://api.airtelsms.com/v2/dlt/push',
    },
    {
      id: 'INT-05',
      code: 'INT-007',
      name: 'Biometric Turnstile Ingestion',
      category: 'Hardware',
      provider: 'ZKTeco ProCapture / Essl eTimeTrack',
      status: 'Connected',
      details: 'Push SDK listener synchronizing turnstile fingerprint & face-scan punches',
      latencyOrQuota: '12 Hardware Gates Active',
      endpoint: 'tcp://192.168.1.120:4370',
    },
    {
      id: 'INT-06',
      code: 'INT-008',
      name: 'RFID Bus Boarding Readers',
      category: 'Hardware',
      provider: 'Zebra RFID 865-868 MHz',
      status: 'Connected',
      details: 'Instant student tap event on boarding and de-boarding school buses',
      latencyOrQuota: '28 Fleet Units Synced',
      endpoint: 'https://telematics.lumenacademy.edu.in/rfid/tap',
    },
    {
      id: 'INT-07',
      code: 'INT-009',
      name: 'AIS-140 GPS Telematics',
      category: 'Hardware',
      provider: 'iTriangle Fleet Telematics API',
      status: 'Connected',
      details: '10-second polling frequency with panic SOS button and route deviation triggers',
      latencyOrQuota: 'Live Telemetry Active',
      endpoint: 'https://api.itriangle.in/ais140/v3/feed',
    },
    {
      id: 'INT-08',
      code: 'INT-014',
      name: 'DigiLocker NAD Issuer',
      category: 'Government & Identity',
      provider: 'National Academic Depository (NeGD)',
      status: 'Connected',
      details: 'Automated cryptographic push of CBSE marksheets and Transfer Certificates',
      latencyOrQuota: 'API Verified (DocType: SCHLR)',
      endpoint: 'https://nad.digitallocker.gov.in/api/v2/pushDoc',
    },
    {
      id: 'INT-09',
      code: 'INT-010',
      name: 'Google Workspace for Education',
      category: 'Government & Identity',
      provider: 'Google Cloud Identity / SSO',
      status: 'Connected',
      details: 'Single sign-on and roster synchronization for LumenAcademy Google Meet classrooms',
      latencyOrQuota: '180 Faculty Linked',
      endpoint: 'https://admin.googleapis.com/admin/directory/v1/users',
    },
  ]);

  const handleTestWebhook = () => {
    setShowPayloadModal(true);
    addToast(`Dispatched test event payload (HMAC-SHA256) to ${webhookUrl}`, 'success');
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      addToast('Please provide a descriptive name for the API key', 'warning');
      return;
    }
    const secret = `lmn_live_${Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      prefix: `${secret.substring(0, 12)}...${secret.substring(secret.length - 4)}`,
      created: new Date().toISOString().split('T')[0],
      scopes: [...newKeyScopes],
      status: 'ACTIVE',
    };
    setApiKeys(prev => [newKey, ...prev]);
    setNewGeneratedSecret(secret);
    setNewKeyName('');
    addToast(`API Key "${newKey.name}" generated with cryptographic token`, 'success');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev =>
      prev.map(k => (k.id === id ? { ...k, status: 'REVOKED' } : k))
    );
    addToast('API Key revoked immediately. Token invalid across all cluster endpoints.', 'warning');
  };

  const handleSaveServiceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setIntegrations(prev =>
      prev.map(item => (item.id === selectedService.id ? selectedService : item))
    );
    setShowConfigModal(false);
    addToast(`Configuration saved for ${selectedService.name}`, 'success');
  };

  const filteredIntegrations = activeCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === activeCategory);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-subtle text-brand">
              INT · Module 35
            </span>
            <span className="text-xs text-ink-muted">17 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Integrations & Hardware Telematics Hub
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Unified API gateway connecting Payment Gateways, WhatsApp Cloud, TRAI DLT, Biometrics, GPS Telematics, and DigiLocker.
          </p>
        </div>

        <button
          onClick={() => setShowApiKeyModal(true)}
          className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">key</span>
          <span>Manage API Keys</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-3">
        {['all', 'Payments', 'Messaging', 'Hardware', 'Government & Identity'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-brand text-white shadow-xs'
                : 'text-ink-soft bg-slate-100 hover:bg-subtle'
            }`}
          >
            {cat === 'all' ? 'All Integrations (17)' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Active Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(item => (
          <div
            key={item.id}
            className="p-4 bg-surface rounded-2xl border border-line-soft shadow-sm flex flex-col justify-between hover:border-brand transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand bg-subtle px-2 py-0.5 rounded">
                  {item.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {item.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-ink mt-2.5">
                {item.name}
              </h3>
              <div className="text-xs font-semibold text-ink-muted mt-0.5">
                Provider: {item.provider}
              </div>
              <p className="text-xs text-ink-soft mt-2 line-clamp-2">
                {item.details}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-ink-muted">
                {item.latencyOrQuota}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedService({ ...item });
                    setShowConfigModal(true);
                  }}
                  className="text-slate-600 hover:text-ink text-xs font-semibold"
                >
                  Configure
                </button>
                <button
                  onClick={() => addToast(`Testing connection to ${item.name}... Success! (Ping: 38ms, SSL TLSv1.3 OK)`, 'success')}
                  className="text-brand hover:underline font-bold text-xs"
                >
                  Ping →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Webhooks & Event Streaming Configuration (INT-016) */}
      <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-ink">Outbound Webhooks & Event Streaming (INT-016)</h3>
            <p className="text-xs text-ink-muted">
              Real-time HMAC-SHA256 signed event dispatch for attendance, fee receipts, and student admissions.
            </p>
          </div>
          <span className="text-xs font-mono bg-subtle text-brand px-2.5 py-1 rounded-lg font-bold self-start sm:self-auto">
            Payload Format: JSON
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            className="flex-1 w-full bg-wash border border-line-soft rounded-xl px-3 py-2 text-xs font-mono text-ink focus:outline-hidden focus:border-brand"
          />
          <button
            onClick={handleTestWebhook}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold transition-all shrink-0"
          >
            Dispatch Test Ping Payload
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
          <span className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-ink-soft">
            ✓ <code>fee.payment.success</code>
          </span>
          <span className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-ink-soft">
            ✓ <code>attendance.student.absent</code>
          </span>
          <span className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-ink-soft">
            ✓ <code>transport.sos.triggered</code>
          </span>
          <span className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-ink-soft">
            ✓ <code>exam.reportcard.published</code>
          </span>
        </div>
      </div>

      {/* Modal: API Key Management */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Institutional API Key Governance</h3>
                <span className="text-xs text-ink-muted">HMAC signature tokens for external subsystems & client apps</span>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Generated Secret Notification */}
            {newGeneratedSecret && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">New Token Generated (Save Now — Not Shown Again)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(newGeneratedSecret);
                      addToast('Secret API key copied to clipboard', 'success');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>Copy</span>
                  </button>
                </div>
                <code className="block p-2 bg-white rounded border border-emerald-200 font-mono text-xs text-ink break-all">
                  {newGeneratedSecret}
                </code>
              </div>
            )}

            {/* Create API Key Form */}
            <form onSubmit={handleCreateApiKey} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-ink block">Generate New API Key</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">Key Description / Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. ERP Biometric Proxy Daemon"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="w-full bg-white border border-line rounded-xl p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">Select Scopes</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['read:students', 'write:attendance', 'read:fees', 'write:transport_gps'].map(scope => (
                      <label key={scope} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyScopes.includes(scope)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewKeyScopes(prev => [...prev, scope]);
                            } else {
                              setNewKeyScopes(prev => prev.filter(s => s !== scope));
                            }
                          }}
                        />
                        <span>{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold text-xs"
                >
                  Generate Key
                </button>
              </div>
            </form>

            {/* Active Keys List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-ink-soft uppercase">Active Institutional API Keys</span>
              <div className="space-y-2">
                {apiKeys.map(k => (
                  <div key={k.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-ink">{k.name}</div>
                      <div className="font-mono text-ink-muted text-[11px]">{k.prefix} • Created {k.created}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {k.scopes.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 text-ink-soft text-[10px] font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      {k.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-xs"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">REVOKED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-subtle">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configure Service */}
      {showConfigModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Configure {selectedService.name}</h3>
                <span className="text-xs text-ink-muted">Provider: {selectedService.provider}</span>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveServiceConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1">Service Endpoint URL</label>
                <input
                  type="text"
                  value={selectedService.endpoint || ''}
                  onChange={e => setSelectedService({ ...selectedService, endpoint: e.target.value })}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs font-mono text-ink"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Status Mode</label>
                <select
                  value={selectedService.status}
                  onChange={e => setSelectedService({ ...selectedService, status: e.target.value as any })}
                  className="w-full bg-wash border border-line rounded-xl p-2 text-xs"
                >
                  <option value="Connected">Connected (Production Live)</option>
                  <option value="Configured">Configured (Sandbox Staging)</option>
                  <option value="Standby">Standby (Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1">Latency SLA / Quota Note</label>
                <input
                  type="text"
                  value={selectedService.latencyOrQuota}
                  onChange={e => setSelectedService({ ...selectedService, latencyOrQuota: e.target.value })}
                  className="w-full bg-wash border border-line rounded-xl p-2.5 text-xs text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Webhook Test Payload Inspector */}
      {showPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">Outbound Webhook Dispatch Inspector</h3>
                <span className="text-xs text-ink-muted">Dispatched to {webhookUrl}</span>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="text-ink-muted hover:text-ink">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-ink-soft block mb-1">HTTP Headers:</span>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
{`POST /api/v1/events/webhook HTTP/1.1
Content-Type: application/json
X-Lumen-Signature: sha256=9b3d1f05a9c84e1b5f...
X-Lumen-Timestamp: ${Date.now()}`}
                </pre>
              </div>

              <div>
                <span className="font-bold text-ink-soft block mb-1">Payload JSON Body:</span>
                <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
{JSON.stringify({
  event: "fee.payment.success",
  tenant_id: "lumen_chn_01",
  branch_id: "branch-omr",
  timestamp: new Date().toISOString(),
  data: {
    transaction_id: "TXN_LMN_2026_9941",
    student_id: "STU-CHN-2026-004",
    amount_inr: 45000,
    payment_mode: "UPI_AUTOPAY",
    receipt_no: "RCP-2026-0812"
  }
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-subtle">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"event":"ping"}'`);
                  addToast('cURL test snippet copied', 'success');
                }}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">terminal</span>
                <span>Copy cURL</span>
              </button>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
