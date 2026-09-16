import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CBSE_SAMPLE_QUESTIONS } from '../../data/mockData';

export const QuestionPapersView: React.FC = () => {
  const { addToast } = useApp();
  const [examSubject, setExamSubject] = useState('Science (Class 10)');
  const [paperCode, setPaperCode] = useState('CBSE-10-SCI-SET-1');
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');

  // AI Typology weights
  const [showTypologyModal, setShowTypologyModal] = useState(false);
  const [competencyWeight, setCompetencyWeight] = useState(50);
  const [analyticalWeight, setAnalyticalWeight] = useState(30);
  const [knowledgeWeight, setKnowledgeWeight] = useState(20);

  // Print/Watermark modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL — PRE-BOARD 2025');

  const sectionQuestions: Record<'A' | 'B' | 'C' | 'D' | 'E', Array<{
    num: string;
    marks: number;
    title: string;
    stemEn: string;
    stemHi?: string;
    formula?: string;
  }>> = {
    A: [
      {
        num: 'Q.1',
        marks: 1,
        title: 'Multiple Choice Question',
        stemEn: 'Which of the following colors of white light has the maximum speed in glass?',
        stemHi: 'निम्नलिखित में से कांच में किस रंग के प्रकाश की चाल अधिकतम होती है?',
      },
      {
        num: 'Q.2',
        marks: 1,
        title: 'Assertion & Reason',
        stemEn: 'Assertion (A): The sky appears blue to an astronaut in space.\nReason (R): Atmospheric refraction causes scattering of light at higher altitudes.',
        stemHi: 'अभिकथन (A): अंतरिक्ष यात्री को आकाश नीला दिखाई देता है। कारण (R): वायुमंडलीय अपवर्तन होता है।',
      },
      {
        num: 'Q.3',
        marks: 1,
        title: 'Direct MCQ',
        stemEn: 'The focal length of a concave mirror is 20 cm. Its radius of curvature is:',
        stemHi: 'एक अवतल दर्पण की फोकस दूरी 20 सेमी है। इसकी वक्रता त्रिज्या होगी:',
      },
    ],
    B: CBSE_SAMPLE_QUESTIONS.map((q, idx) => ({
      num: `Q.${idx + 21}`,
      marks: q.marks,
      title: q.chapter,
      stemEn: q.stemEn,
      stemHi: q.stemHi,
      formula: q.formulaLatex,
    })),
    C: [
      {
        num: 'Q.27',
        marks: 3,
        title: 'Short Answer (3 Marks)',
        stemEn: 'A convex lens of focal length 15 cm forms an image at a distance of 30 cm from the lens. Calculate the distance of the object from the lens and determine the magnification produced.',
        stemHi: '15 सेमी फोकस दूरी वाला एक उत्तल लेंस, लेंस से 30 सेमी की दूरी पर एक छवि बनाता है। लेंस से वस्तु की दूरी और आवर्धन ज्ञात करें।',
        formula: '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad m = \\frac{v}{u}',
      },
      {
        num: 'Q.28',
        marks: 3,
        title: 'Refraction through Prism (3 Marks)',
        stemEn: 'Explain why the sun appears reddish early in the morning and at sunset. Draw a neat labeled ray diagram supporting your answer.',
        stemHi: 'स्पष्ट कीजिए कि सूर्योदय एवं सूर्यास्त के समय सूर्य रक्ताभ क्यों दिखाई देता है? नामांकित किरण आरेख खींचिए।',
      },
    ],
    D: [
      {
        num: 'Q.34',
        marks: 5,
        title: 'Long Answer (5 Marks) with Internal Choice',
        stemEn: 'State Snell’s Law of Refraction. A ray of light travelling in water enters obliquely into crown glass (μ_glass = 1.52, μ_water = 1.33). Calculate the critical angle and illustrate with ray diagram.',
        stemHi: 'अपवर्तन के स्नेल नियम का उल्लेख कीजिए। जल में गमन करने वाली प्रकाश किरण कांच में तिरछी प्रवेश करती है। क्रांतिक कोण की गणना कीजिए।',
        formula: 'n_{21} = \\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1}',
      },
    ],
    E: [
      {
        num: 'Q.37',
        marks: 4,
        title: 'Case-Based Competency Question (NEP 2020)',
        stemEn: 'Read the following passage: Sir Isaac Newton was the first to use a glass prism to obtain the spectrum of sunlight. He placed a second identical prism in an inverted position with respect to the first prism.\n(a) What did Newton observe when inverted prism was positioned? [1 Mark]\n(b) What conclusion did Newton draw regarding white light? [1 Mark]\n(c) Name one natural phenomenon based on dispersion of sunlight and explain conditions needed to observe it. [2 Marks]',
        stemHi: 'सर आइजैक न्यूटन ने सूर्य के प्रकाश का स्पेक्ट्रम प्राप्त करने के लिए पहले कांच के प्रिज्म का उपयोग किया था...',
      },
    ],
  };

  const handleSaveTypology = (e: React.FormEvent) => {
    e.preventDefault();
    if (competencyWeight + analyticalWeight + knowledgeWeight !== 100) {
      addToast('Total weights must sum exactly to 100%', 'error');
      return;
    }
    setShowTypologyModal(false);
    addToast(
      `AI Blueprint balanced: ${competencyWeight}% Competency, ${analyticalWeight}% Analytical, ${knowledgeWeight}% Direct Knowledge`,
      'success'
    );
  };

  const handleExecutePrint = () => {
    window.print();
    setShowPrintModal(false);
    addToast('Print command sent with confidential watermarking', 'success');
  };

  const handleDownloadPaper = () => {
    const paperText = `CENTRAL BOARD OF SECONDARY EDUCATION\nPRE-BOARD EXAMINATION 2025\nSUBJECT: ${examSubject.toUpperCase()}\nPAPER CODE: ${paperCode}\nWATERMARK: [${watermarkText}]\nMAX MARKS: 80 | TIME ALLOWED: 3 HOURS\n\nGENERAL INSTRUCTIONS:\n1. 39 questions across 5 sections (A, B, C, D, E).\n2. Minimum 50% Competency-based items as per NEP 2020.\n\n` +
      (['A', 'B', 'C', 'D', 'E'] as const).map(sec => {
        const questions = sectionQuestions[sec];
        return `=== SECTION ${sec} ===\n` + questions.map(q => `${q.num} [${q.marks} Marks] - ${q.title}\n${q.stemEn}\n${q.stemHi ? `(Hindi): ${q.stemHi}\n` : ''}${q.formula ? `Formula: ${q.formula}\n` : ''}`).join('\n');
      }).join('\n\n');

    const blob = new Blob([paperText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${paperCode}_Confidential_Exam.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowPrintModal(false);
    addToast(`Downloaded official exam paper: ${paperCode}_Confidential_Exam.txt`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>CBSE 2025 Board Examination Blueprint Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            AI Question Paper Studio & Typology Balancer
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Compliant with NEP 2020 Competency-Based Questions ({competencyWeight}% Active) • Bilingual English/Hindi Stems
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTypologyModal(true)}
            className="flex items-center gap-1.5 bg-[#f0f7fb] hover:bg-[#e0ecf4] text-[#0e5d84] text-xs font-semibold px-3 py-2 rounded-xl border border-[#cbe0ec] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Rebalance AI Typology</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Confidential Paper</span>
          </button>
        </div>
      </div>

      {/* Blueprint Matrix Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['A', 'B', 'C', 'D', 'E'] as const).map(sec => {
          const isActive = activeSection === sec;
          const info = {
            A: { title: 'Section A (MCQs)', format: '20 × 1 Mark', total: '20 Marks • Direct/Reasoning' },
            B: { title: 'Section B (VSA)', format: '6 × 2 Marks', total: '12 Marks • Short Answers' },
            C: { title: 'Section C (SA)', format: '7 × 3 Marks', total: '21 Marks • Multi-step' },
            D: { title: 'Section D (LA)', format: '3 × 5 Marks', total: '15 Marks • Detailed / Ray' },
            E: { title: 'Section E (Case-Based)', format: '3 × 4 Marks', total: '12 Marks • Competency' },
          }[sec];

          return (
            <div
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all shadow-xs ${
                isActive
                  ? 'border-[#0e5d84] bg-[#f0f7fb] ring-2 ring-[#0e5d84]'
                  : 'bg-white border-[#e0ecf4] hover:border-[#cbe0ec]'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-[#777587]">{info.title}</div>
              <div className={`text-lg font-bold mt-0.5 ${isActive ? 'text-[#0e5d84]' : 'text-[#082b3d]'}`}>
                {info.format}
              </div>
              <div className="text-[11px] text-[#464555]">{info.total}</div>
            </div>
          );
        })}
      </div>

      {/* Realistic CBSE Board Question Paper Sheet Preview */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 md:p-8 shadow-sm max-w-4xl mx-auto font-serif text-[#082b3d] space-y-6">
        {/* CBSE Exam Header Box */}
        <div className="border-b-2 border-[#082b3d] pb-4 text-center space-y-1">
          <div className="flex justify-between items-center text-xs font-sans font-bold text-[#464555] mb-2">
            <span>Series: <strong>LMN-2025/10</strong></span>
            <span>Set No. <strong>1</strong></span>
            <span>Code No. <strong>{paperCode}</strong></span>
          </div>
          <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-[#777587]">
            Central Board of Secondary Education — Pre-Board Examination 2025
          </h2>
          <h3 className="text-2xl font-bold tracking-tight">{examSubject.toUpperCase()}</h3>
          <h4 className="text-xs uppercase font-sans font-semibold tracking-wider text-[#464555]">
            (Theory / सैद्धांतिक)
          </h4>
          <div className="flex justify-between text-xs font-sans font-semibold pt-2">
            <span>Time Allowed: <strong>3 Hours</strong></span>
            <span>Maximum Marks: <strong>80</strong></span>
          </div>
        </div>

        {/* General Instructions in authentic CBSE format */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-sans space-y-1 text-[#464555]">
          <strong className="text-[#082b3d] block">General Instructions:</strong>
          <p>1. This question paper consists of 39 questions in 5 sections: A, B, C, D, and E.</p>
          <p>2. All questions are compulsory. Internal choice is provided in some questions.</p>
          <p>3. Active section previewed below: <strong>Section {activeSection}</strong>.</p>
        </div>

        {/* Dynamic Section Questions */}
        <div className="space-y-6 font-sans">
          <div className="border-b border-[#f0f7fb] pb-2 flex items-center justify-between">
            <span className="font-bold text-sm text-[#0e5d84]">
              SECTION {activeSection} • {activeSection === 'A' ? '1 Mark' : activeSection === 'B' ? '2 Marks' : activeSection === 'C' ? '3 Marks' : activeSection === 'D' ? '5 Marks' : '4 Marks (Case Study)'} Each
            </span>
            <span className="text-xs bg-[#f0f7fb] text-[#0e5d84] font-mono px-2 py-0.5 rounded">
              Showing {sectionQuestions[activeSection].length} Questions
            </span>
          </div>

          {sectionQuestions[activeSection].map((q, idx) => (
            <div key={idx} className="p-4 bg-[#f0f7fb]/60 rounded-xl border border-[#cbe0ec] space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-bold text-[#082b3d]">{q.num}. ({q.title})</span>
                <span className="font-bold text-[#0e5d84] font-mono">[{q.marks} Marks]</span>
              </div>
              <p className="text-xs font-medium text-[#082b3d] leading-relaxed whitespace-pre-line">
                {q.stemEn}
              </p>
              {q.stemHi && (
                <p className="text-xs text-[#464555] font-serif leading-relaxed italic whitespace-pre-line">
                  {q.stemHi}
                </p>
              )}
              {q.formula && (
                <div className="p-2 bg-white rounded border border-[#cbe0ec] font-mono text-center text-[#0e5d84]">
                  Formula: {q.formula}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Rebalance AI Typology */}
      {showTypologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Rebalance AI Blueprint Typology</h3>
                <span className="text-xs text-[#777587]">NEP 2020 Competency-Based Distribution</span>
              </div>
              <button onClick={() => setShowTypologyModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTypology} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-[#082b3d] mb-1">
                  <span>Competency / Application (Min 50%)</span>
                  <span className="text-[#0e5d84]">{competencyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  step="5"
                  value={competencyWeight}
                  onChange={e => setCompetencyWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#082b3d] mb-1">
                  <span>Analytical & Multi-Step</span>
                  <span className="text-[#0e5d84]">{analyticalWeight}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="5"
                  value={analyticalWeight}
                  onChange={e => setAnalyticalWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#082b3d] mb-1">
                  <span>Direct Knowledge & Recall</span>
                  <span className="text-[#0e5d84]">{knowledgeWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="5"
                  value={knowledgeWeight}
                  onChange={e => setKnowledgeWeight(Number(e.target.value))}
                  className="w-full accent-[#0e5d84]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                <span>Total Weight:</span>
                <span className={competencyWeight + analyticalWeight + knowledgeWeight === 100 ? 'text-emerald-600' : 'text-rose-600'}>
                  {competencyWeight + analyticalWeight + knowledgeWeight}% {competencyWeight + analyticalWeight + knowledgeWeight === 100 ? '✓ Balanced' : '(Must equal 100%)'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowTypologyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl font-bold"
                >
                  Apply Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Print & Confidential Watermark */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Print Confidential Examination Paper</h3>
                <span className="text-xs text-[#777587]">Official CBSE Printing Protocols</span>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#464555] mb-1">Security Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Set Paper Code</label>
                <input
                  type="text"
                  value={paperCode}
                  onChange={e => setPaperCode(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Chain-of-Custody Warning:</strong> Generating this print will register a privileged audit event in the AuditLog (AUD-001) under your administrator actor ID.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={handleDownloadPaper}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download File</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Send to Secure Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
