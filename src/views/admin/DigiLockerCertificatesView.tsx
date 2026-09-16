import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DigiLockerCertificatesView: React.FC = () => {
  const { addToast } = useApp();
  const [dscSigning, setDscSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [pushedToDigiLocker, setPushedToDigiLocker] = useState(false);
  const [digiLockerUri, setDigiLockerUri] = useState('');

  const handleSignDsc = () => {
    setDscSigning(true);
    setTimeout(() => {
      setDscSigning(false);
      setSigned(true);
      addToast('Transfer Certificate signed with Principal Class 3 DSC USB Token (eMudhra CA)', 'success');
    }, 1000);
  };

  const handlePushDigiLocker = () => {
    if (!signed) {
      addToast('Please sign the certificate with Principal DSC before pushing to DigiLocker', 'warning');
      return;
    }
    const uri = 'in.gov.cbse.lmn/tc/2025/084-ADM-0412';
    setPushedToDigiLocker(true);
    setDigiLockerUri(uri);
    addToast(`Pushed signed certificate to Student DigiLocker Account (URI: ${uri})`, 'success');
  };

  const handleDownloadTC = () => {
    const tcDoc = `LUMEN ACADEMY SENIOR SECONDARY SCHOOL
CBSE Affiliation No. 1930412 • School Code: 55192
TRANSFER CERTIFICATE / स्थानांतरण प्रमाण-पत्र
TC No: LMN/2025/084 | Admission No: ADM-2018-0412
==================================================
1. Pupil Name: Aarav S. Ramanathan
2. Mother's Name: Dr. Radhika Ramanathan
3. Father's Name: Sundar Ramanathan
4. Nationality: Indian | Category: General
5. Date of Admission: 04-06-2018 (Grade 4)
6. Class Last Studied: Class 10 (Tenth)
7. Total Working Days: 210 Days | Present: 204 Days (97.1%)
8. Conduct: Exemplary
${signed ? 'DIGITALLY SIGNED: Dr. Arvind Swaminathan (Principal)\nClass 3 DSC Token: eMudhra/2025/4412\nSHA256: d9f8219c2a8019eeb2881' : 'SIGNATURE PENDING'}
${pushedToDigiLocker ? `DIGILOCKER REPOSITORY URI: ${digiLockerUri}` : ''}
==================================================`;
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(tcDoc);
    link.download = `TransferCertificate_LMN_2025_084.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded official Transfer Certificate file', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>National Academic Depository (NAD) & DigiLocker (DOC-004)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Digital Transfer Certificates & Class 3 DSC Signer
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Affiliation No: 1930412 • Cryptographic SHA-256 Stamp • Instant DigiLocker URI Push
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              window.print();
              addToast('Dispatched Transfer Certificate to system printer', 'info');
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print TC</span>
          </button>
          <button
            onClick={handleDownloadTC}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download</span>
          </button>
          <button
            onClick={handleSignDsc}
            disabled={dscSigning || signed}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">{dscSigning ? 'sync' : 'token'}</span>
            <span>{signed ? 'DSC Signed & Sealed' : dscSigning ? 'Signing with DSC...' : 'Sign with Principal DSC'}</span>
          </button>
          <button
            onClick={handlePushDigiLocker}
            className={`flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors ${
              pushedToDigiLocker ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
            <span>{pushedToDigiLocker ? 'Pushed to DigiLocker ✓' : 'Push to DigiLocker'}</span>
          </button>
        </div>
      </div>

      {pushedToDigiLocker && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <div>
              <span className="font-bold">DigiLocker Verified: </span>
              <span>Available in student's DigiLocker document locker under CBSE records.</span>
              <div className="font-mono text-[11px] text-emerald-800 mt-0.5">URI: {digiLockerUri}</div>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(digiLockerUri);
              addToast('Copied DigiLocker URI to clipboard', 'info');
            }}
            className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-xs self-start sm:self-auto"
          >
            Copy URI
          </button>
        </div>
      )}

      {/* Realistic CBSE Transfer Certificate Preview */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm max-w-3xl mx-auto font-serif text-[#082b3d] space-y-6">
        {/* School Header */}
        <div className="text-center border-b-2 border-[#082b3d] pb-4 space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            LUMEN ACADEMY SENIOR SECONDARY SCHOOL
          </h2>
          <p className="text-xs font-sans text-[#464555]">
            (Affiliated to Central Board of Secondary Education, New Delhi • Affiliation No. 1930412)
          </p>
          <p className="text-xs font-sans text-[#464555]">
            Anna Salai, Guindy Institutional Corridor, Chennai - 600032
          </p>
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#0e5d84] pt-2">
            TRANSFER CERTIFICATE / स्थानांतरण प्रमाण-पत्र
          </h3>
          <div className="flex justify-between text-xs font-sans font-semibold pt-1 text-[#777587]">
            <span>TC No: <strong>LMN/2025/084</strong></span>
            <span>School Code: <strong>55192</strong></span>
            <span>Admission No: <strong>ADM-2018-0412</strong></span>
          </div>
        </div>

        {/* Certificate Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div>1. Name of Pupil: <strong>Aarav S. Ramanathan</strong></div>
          <div>2. Mother's Name: <strong>Dr. Radhika Ramanathan</strong></div>
          <div>3. Father's / Guardian's Name: <strong>Sundar Ramanathan</strong></div>
          <div>4. Nationality: <strong>Indian</strong></div>
          <div>5. Whether candidate belongs to SC/ST/OBC: <strong>General</strong></div>
          <div>6. Date of Admission with Class: <strong>04-06-2018 (Grade 4)</strong></div>
          <div>7. Class in which pupil last studied: <strong>Class 10 (Tenth)</strong></div>
          <div>8. School / Board Annual Examination last taken: <strong>CBSE Class 10 Pre-Board</strong></div>
          <div>9. Total No. of working days in school: <strong>210 Days</strong></div>
          <div>10. Total No. of working days present: <strong>204 Days (97.1%)</strong></div>
        </div>

        {/* Digital Signature Box */}
        <div className="border-t-2 border-[#082b3d] pt-4 flex flex-col sm:flex-row justify-between items-end gap-4 font-sans">
          <div className="text-left space-y-1">
            <div className="text-[10px] text-[#777587]">DIGITALLY VERIFIABLE VIA QR:</div>
            <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-[9px] font-mono text-center p-1">
              <span className="material-symbols-outlined text-2xl text-slate-700">qr_code_2</span>
              <span className="text-[8px] text-slate-500">NAD / DigiLocker</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            {signed ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 text-left">
                <div className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>Digitally Signed by:</span>
                </div>
                <div>Dr. Arvind Swaminathan (Principal)</div>
                <div className="text-[10px] font-mono text-emerald-700">Class 3 DSC • Cert ID: eMudhra/2025/4412</div>
                <div className="text-[10px] text-emerald-700">Timestamp: 26 Feb 2025, 09:30:14 IST</div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Signature Pending (Attach USB DSC Token)
              </div>
            )}
            <div className="text-xs font-bold text-[#082b3d] pt-1">Principal & Head of Institution</div>
          </div>
        </div>
      </div>
    </div>
  );
};
