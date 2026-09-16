import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CBSE_SAMPLE_QUESTIONS } from '../../data/mockData';
import { QuestionItem } from '../../types';

export const QuestionBankView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedBloom, setSelectedBloom] = useState('ALL');
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState(CBSE_SAMPLE_QUESTIONS);
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [newChapter, setNewChapter] = useState('Light - Reflection and Refraction');
  const [newBloom, setNewBloom] = useState('L3 Applying');
  const [newMarks, setNewMarks] = useState(2);
  const [newStemEn, setNewStemEn] = useState('');
  const [newStemHi, setNewStemHi] = useState('');
  const [newFormula, setNewFormula] = useState('');

  const bloomTiers = [
    { level: 'L1', name: 'Remembering', count: 3200, color: 'bg-slate-100 text-slate-800' },
    { level: 'L2', name: 'Understanding', count: 4100, color: 'bg-emerald-100 text-emerald-800' },
    { level: 'L3', name: 'Applying', count: 3850, color: 'bg-[#e0f2fe] text-[#082b3d]' },
    { level: 'L4', name: 'Analyzing', count: 2100, color: 'bg-amber-100 text-amber-800' },
    { level: 'L5', name: 'Evaluating', count: 1100, color: 'bg-orange-100 text-orange-900' },
    { level: 'L6', name: 'Creating', count: 500, color: 'bg-rose-100 text-rose-800' },
  ];

  const filteredQuestions = questions.filter(q => {
    const matchesBloom = selectedBloom === 'ALL' || q.bloomTier.startsWith(selectedBloom);
    const matchesSearch =
      search.trim() === '' ||
      q.chapter.toLowerCase().includes(search.toLowerCase()) ||
      q.stemEn.toLowerCase().includes(search.toLowerCase()) ||
      q.code.toLowerCase().includes(search.toLowerCase());
    return matchesBloom && matchesSearch;
  });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStemEn) {
      addToast('Please enter the English question stem', 'error');
      return;
    }

    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      code: `CBSE-10-SCI-Q${questions.length + 101}`,
      chapter: newChapter,
      section: `Section (${Number(newMarks)} Marks)`,
      bloomTier: newBloom,
      difficulty: newMarks >= 4 ? 'Hard' : newMarks >= 2 ? 'Medium' : 'Easy',
      marks: Number(newMarks),
      stemEn: newStemEn,
      stemHi: newStemHi || undefined,
      formulaLatex: newFormula || undefined,
      verifiedBy: 'Mrs. Malini Iyer (PGT Science)',
    };

    setQuestions([newQ, ...questions]);
    setShowAddModal(false);
    setNewStemEn('');
    setNewStemHi('');
    setNewFormula('');
    addToast(`Added new item ${newQ.code} to central question repository`, 'success');
  };

  const handleExportBank = () => {
    const headers = ['Code', 'Chapter', 'BloomTier', 'Marks', 'StemEn', 'VerifiedBy'];
    const rows = filteredQuestions.map(q => [
      `"${q.code}"`,
      `"${q.chapter}"`,
      `"${q.bloomTier}"`,
      q.marks,
      `"${q.stemEn.replace(/"/g, '""')}"`,
      `"${q.verifiedBy}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBSE_Question_Bank_${selectedBloom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filteredQuestions.length} questions to CSV`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">database</span>
            <span>Central Question Bank & Cognitive Taxonomy</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            14,850 Vetted CBSE & NCERT Items Repository
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            Categorized across Bloom's Revised Taxonomy • LaTeX verified • Hindi & English Bilingual Pairs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBank}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Bloom's Revised Taxonomy Spectrum */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {bloomTiers.map(b => (
          <div
            key={b.level}
            onClick={() => setSelectedBloom(b.level === selectedBloom ? 'ALL' : b.level)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedBloom === b.level
                ? 'border-[#0e5d84] bg-[#f0f7fb] ring-2 ring-[#0e5d84]'
                : 'bg-white border-[#e0ecf4] hover:border-[#cbe0ec]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${b.color}`}>
                {b.level}
              </span>
              <span className="font-mono text-xs font-bold text-[#082b3d]">{b.count}</span>
            </div>
            <div className="text-xs font-bold text-[#082b3d]">{b.name}</div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f0f7fb] border border-[#cbe0ec] rounded-xl px-3 py-2 text-xs">
            <span className="material-symbols-outlined text-base text-[#0e5d84]">search</span>
            <input
              type="text"
              placeholder="Search by chapter, concept (e.g., lens formula, refraction, trigonometry)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-hidden w-full text-[#082b3d]"
            />
          </div>
          <span className="text-xs text-[#777587] whitespace-nowrap">
            Showing {filteredQuestions.length} of {questions.length} items
          </span>
        </div>

        <div className="space-y-3">
          {filteredQuestions.map(q => (
            <div key={q.id} className="p-4 rounded-xl bg-[#f0f7fb]/60 border border-[#cbe0ec] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0e5d84] bg-white px-2 py-0.5 rounded border border-[#cbe0ec]">
                    {q.code}
                  </span>
                  <span className="font-bold text-[#082b3d]">{q.chapter}</span>
                </div>
                <span className="bg-[#e0f2fe] text-[#082b3d] text-[10px] font-bold px-2 py-0.5 rounded">
                  {q.bloomTier}
                </span>
              </div>
              <p className="text-xs text-[#082b3d] leading-relaxed">{q.stemEn}</p>
              {q.stemHi && <p className="text-xs text-[#464555] italic leading-relaxed">{q.stemHi}</p>}
              {q.formulaLatex && (
                <div className="p-1.5 bg-white rounded border border-[#cbe0ec] font-mono text-[11px] text-[#0e5d84]">
                  Formula: {q.formulaLatex}
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-[#cbe0ec] text-[11px] text-[#777587]">
                <span>Marks: <strong>{q.marks}</strong></span>
                <span>Verified: {q.verifiedBy}</span>
                <button
                  onClick={() => addToast(`Added question ${q.code} to active examination paper draft`, 'success')}
                  className="text-[#0e5d84] font-semibold hover:underline"
                >
                  + Add to Paper
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#cbe0ec] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0f7fb] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#082b3d]">Author New Question Item</h3>
                <span className="text-xs text-[#777587]">NEP 2020 & Bloom's Revised Taxonomy</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-[#777587] hover:text-[#082b3d]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Subject & Chapter</label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={e => setNewChapter(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs text-[#082b3d]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#464555] mb-1">Bloom's Taxonomy Tier</label>
                  <select
                    value={newBloom}
                    onChange={e => setNewBloom(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs text-[#082b3d]"
                  >
                    <option value="L1 Remembering">L1 Remembering</option>
                    <option value="L2 Understanding">L2 Understanding</option>
                    <option value="L3 Applying">L3 Applying</option>
                    <option value="L4 Analyzing">L4 Analyzing</option>
                    <option value="L5 Evaluating">L5 Evaluating</option>
                    <option value="L6 Creating">L6 Creating</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Marks Assigned</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newMarks}
                  onChange={e => setNewMarks(Number(e.target.value))}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Question Stem (English) *</label>
                <textarea
                  rows={3}
                  value={newStemEn}
                  onChange={e => setNewStemEn(e.target.value)}
                  placeholder="Enter clear, competency-based question wording..."
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Question Stem (Hindi translation - Optional)</label>
                <textarea
                  rows={2}
                  value={newStemHi}
                  onChange={e => setNewStemHi(e.target.value)}
                  placeholder="हिंदी अनुवाद दर्ज करें..."
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2.5 text-xs text-[#082b3d]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#464555] mb-1">Mathematical / Chemical Formula (LaTeX - Optional)</label>
                <input
                  type="text"
                  value={newFormula}
                  onChange={e => setNewFormula(e.target.value)}
                  placeholder="e.g. \mu = \frac{\sin(A+D_m)/2}{\sin(A/2)}"
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-2 text-xs font-mono text-[#082b3d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f7fb]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#082b3d] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl font-bold"
                >
                  Save to Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
