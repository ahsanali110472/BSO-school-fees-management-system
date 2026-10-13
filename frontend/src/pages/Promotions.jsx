import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  History,
  GraduationCap,
  Save,
  RotateCcw,
  Check,
  X,
  Calendar,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import api from '../services/api';

export default function Promotions() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Filter Selection
  const [fromSessionId, setFromSessionId] = useState('');
  const [toSessionId, setToSessionId] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [fromSectionId, setFromSectionId] = useState('');
  const [defaultToSectionId, setDefaultToSectionId] = useState('');

  // Candidates & Decisions
  const [candidates, setCandidates] = useState([]);
  const [decisions, setDecisions] = useState({}); // { studentId: { action, targetSectionId, rollNumber } }
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [notes, setNotes] = useState('');

  // Feedback states
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [sessRes, clsRes, secRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/classes'),
        api.get('/sections'),
      ]);

      const sessList = sessRes?.data?.sessions || sessRes?.data?.data?.sessions || [];
      const clsList = clsRes?.data?.classes || clsRes?.data?.data?.classes || [];
      const secList = secRes?.data?.sections || secRes?.data?.data?.sections || [];

      setSessions(sessList);
      setClasses(clsList);
      setSections(secList);

      // Auto-set current session as source, and next session as target
      const current = sessList.find((s) => s.isCurrent) || sessList[0];
      const future = sessList.find((s) => !s.isCurrent) || sessList[1] || current;

      if (current) setFromSessionId(current._id);
      if (future) setToSessionId(future._id);

      if (clsList.length > 0) {
        setFromClassId(clsList[0]._id);
        // Auto-select next class if available
        if (clsList.length > 1) {
          setToClassId(clsList[1]._id);
        } else {
          setToClassId(clsList[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load promotion lookups:', err);
      setError('Could not load academic sessions or classes.');
    }
  };

  // When source class changes, intelligently guess target class
  const handleFromClassChange = (newClassId) => {
    setFromClassId(newClassId);
    const currentIndex = classes.findIndex((c) => c._id === newClassId);
    if (currentIndex !== -1 && currentIndex + 1 < classes.length) {
      setToClassId(classes[currentIndex + 1]._id);
    }
    setCandidates([]);
  };

  const fetchCandidates = async () => {
    if (!fromSessionId || !fromClassId) {
      setError('Please select both Source Session and Source Class.');
      return;
    }

    setLoadingCandidates(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.get('/promotions/candidates', {
        params: {
          sessionId: fromSessionId,
          classId: fromClassId,
          sectionId: fromSectionId || undefined,
        },
      });

      const list = res?.data?.candidates || res?.data?.data?.candidates || [];
      setCandidates(list);

      // Initialize default decisions: All promoted with default target section and incrementing roll number
      const initialDecisions = {};
      list.forEach((enrollment, index) => {
        const student = enrollment.student;
        if (student) {
          initialDecisions[student._id] = {
            studentId: student._id,
            action: 'promoted',
            targetSectionId: defaultToSectionId || enrollment.section?._id || '',
            rollNumber: enrollment.rollNumber || String(index + 1).padStart(2, '0'),
          };
        }
      });
      setDecisions(initialDecisions);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError(err.response?.data?.message || 'Failed to fetch enrolled students.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleDecisionChange = (studentId, field, value) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleBulkAction = (actionType) => {
    const updated = { ...decisions };
    Object.keys(updated).forEach((id) => {
      updated[id].action = actionType;
    });
    setDecisions(updated);
  };

  const executePromotion = async () => {
    if (!candidates.length) return;
    if (fromSessionId === toSessionId) {
      setError('Source session and target session cannot be identical.');
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const studentDecisions = Object.values(decisions);
      const res = await api.post('/promotions/batch', {
        fromSessionId,
        toSessionId,
        fromClassId,
        toClassId,
        studentDecisions,
        notes: notes.trim() || undefined,
      });

      const summary = res.data.data.summary;
      setSuccessMsg(
        `Promotion Batch Complete: ${summary.promotedCount} promoted, ${summary.retainedCount} retained, ${summary.passedOutCount} passed out.`
      );
      setCandidates([]);
      setDecisions({});
    } catch (err) {
      console.error('Promotion execution failed:', err);
      setError(err.response?.data?.message || 'Failed to execute promotion batch.');
    } finally {
      setExecuting(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/promotions/history');
      setHistoryList(res?.data?.history || res?.data?.data?.history || []);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to fetch promotion history:', err);
      setError('Could not load promotion history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const targetSections = toClassId
    ? sections.filter((s) => (s.class?._id || s.class) === toClassId)
    : sections;

  const fromSections = fromClassId
    ? sections.filter((s) => (s.class?._id || s.class) === fromClassId)
    : sections;

  // Counts
  const promotedCount = Object.values(decisions).filter((d) => d.action === 'promoted').length;
  const retainedCount = Object.values(decisions).filter((d) => d.action === 'retained').length;
  const passedOutCount = Object.values(decisions).filter((d) => d.action === 'passed_out').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Student Promotions & Transfers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Section 18: Annual session-to-session batch progression, retention, and graduation engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <History className="w-4 h-4 text-gray-500" />
            Promotion History
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Configuration Card: Source & Target Selectors */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-indigo-900 border-b pb-2">
          Annual Progression Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Parameters */}
          <div className="space-y-4 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" /> Source (Current Class)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Source Session</label>
                <select
                  value={fromSessionId}
                  onChange={(e) => setFromSessionId(e.target.value)}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Source Class</label>
                <select
                  value={fromClassId}
                  onChange={(e) => handleFromClassChange(e.target.value)}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">
                  Source Section <span className="font-normal text-gray-400">(Optional filter)</span>
                </label>
                <select
                  value={fromSectionId}
                  onChange={(e) => setFromSectionId(e.target.value)}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Sections</option>
                  {fromSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Target Parameters */}
          <div className="space-y-4 p-4 bg-indigo-50/40 rounded-xl border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-indigo-600" /> Target (New Academic Session)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Session</label>
                <select
                  value={toSessionId}
                  onChange={(e) => setToSessionId(e.target.value)}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Promote To Class</label>
                <select
                  value={toClassId}
                  onChange={(e) => {
                    setToClassId(e.target.value);
                    setDefaultToSectionId('');
                  }}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">Default Target Section</label>
                <select
                  value={defaultToSectionId}
                  onChange={(e) => setDefaultToSectionId(e.target.value)}
                  className="w-full py-2 px-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Keep current section or assign manually</option>
                  {targetSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Load Candidates Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={fetchCandidates}
            disabled={loadingCandidates}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            {loadingCandidates ? 'Fetching Enrolled Students...' : 'Fetch Promotion Candidates'}
          </button>
        </div>
      </div>

      {/* Candidates Evaluation Table */}
      {candidates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/60">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Evaluation Roster ({candidates.length} Students)
              </h3>
              <p className="text-xs text-gray-500">
                Configure individual decisions before committing batch progression.
              </p>
            </div>

            {/* Bulk Action Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('promoted')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition"
              >
                Mark All Promoted
              </button>
              <button
                onClick={() => handleBulkAction('retained')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition"
              >
                Mark All Retained
              </button>
              <button
                onClick={() => handleBulkAction('passed_out')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
              >
                Mark All Passed Out
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">GR & Roll</th>
                  <th className="py-3 px-4">Current Class/Sec</th>
                  <th className="py-3 px-4">Promotion Decision</th>
                  <th className="py-3 px-4">Target Section</th>
                  <th className="py-3 px-4">New Roll No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((en) => {
                  const student = en.student;
                  if (!student) return null;
                  const currentDecision = decisions[student._id] || {};

                  return (
                    <tr key={en._id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {student.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">{student.name}</span>
                            <span className="text-gray-400 font-mono text-[11px]">
                              {student.studentId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-gray-800">{student.grNumber || '—'}</span>
                          <span className="block text-gray-400">Roll: {en.rollNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{en.class?.name}</span>
                        <span className="block text-gray-500">Sec {en.section?.name || 'A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={currentDecision.action || 'promoted'}
                          onChange={(e) => handleDecisionChange(student._id, 'action', e.target.value)}
                          className={`font-semibold py-1 px-2.5 rounded-lg text-xs border ${
                            currentDecision.action === 'promoted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : currentDecision.action === 'retained'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          <option value="promoted">Promote</option>
                          <option value="retained">Retain / Repeat</option>
                          <option value="passed_out">Pass Out / Graduate</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {currentDecision.action === 'passed_out' ? (
                          <span className="text-gray-400 italic">Not applicable</span>
                        ) : (
                          <select
                            value={currentDecision.targetSectionId || ''}
                            onChange={(e) =>
                              handleDecisionChange(student._id, 'targetSectionId', e.target.value)
                            }
                            className="py-1 px-2 border border-gray-300 rounded-lg text-xs bg-white"
                          >
                            <option value="">Default Section</option>
                            {targetSections.map((s) => (
                              <option key={s._id} value={s._id}>
                                Section {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {currentDecision.action === 'passed_out' ? (
                          <span className="text-gray-400 italic">—</span>
                        ) : (
                          <input
                            type="text"
                            value={currentDecision.rollNumber || ''}
                            onChange={(e) =>
                              handleDecisionChange(student._id, 'rollNumber', e.target.value)
                            }
                            className="w-16 py-1 px-2 border border-gray-300 rounded-lg text-xs font-mono"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Execution Bar */}
          <div className="p-4 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-gray-700">Summary:</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {promotedCount} Promoted
              </span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">
                {retainedCount} Retained
              </span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                {passedOutCount} Passed Out
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Optional audit notes (e.g. Annual Exam 2026 results)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs py-2 px-3 border border-gray-300 rounded-lg w-64 bg-white"
              />
              <button
                onClick={executePromotion}
                disabled={executing}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {executing ? 'Committing Batch...' : 'Commit Batch Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Promotion Audit History
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No previous promotions recorded yet.
                </p>
              ) : (
                historyList.map((h) => (
                  <div key={h._id} className="p-4 border rounded-xl bg-gray-50 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        {h.fromClass?.name} ({h.fromSession?.name}) &rarr; {h.toClass?.name} (
                        {h.toSession?.name})
                      </span>
                      <span className="text-gray-400">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-600">
                      <span>Evaluated: {h.totalEvaluated}</span>
                      <span>Promoted: {h.totalPromoted}</span>
                      <span>Retained: {h.totalRetained}</span>
                      <span>Passed Out: {h.totalPassedOut}</span>
                    </div>
                    {h.notes && (
                      <p className="text-gray-500 italic text-[11px]">"{h.notes}"</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
