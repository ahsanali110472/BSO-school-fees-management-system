import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Layers,
  Calendar,
  Percent,
  UserCheck,
  Building,
  Tag,
  Clock,
  X,
  RefreshCw,
  Award
} from 'lucide-react';
import api from '../services/api';

const TABS = [
  { id: 'structures', label: 'Class Fee Structures', icon: Layers },
  { id: 'heads', label: 'Fee Heads & Categories', icon: Tag },
  { id: 'concessions', label: 'Concessions & Scholarships', icon: Award },
];

export default function FeeStructure() {
  const [activeTab, setActiveTab] = useState('structures');

  // Lookups
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);

  // Active Selections for Class Structure
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [currentStructure, setCurrentStructure] = useState(null);
  const [classFeeItems, setClassFeeItems] = useState({}); // { headId: { enabled: boolean, amount: number } }
  const [dueDayOfMonth, setDueDayOfMonth] = useState(10);
  const [gracePeriodDays, setGracePeriodDays] = useState(5);
  const [lateFineType, setLateFineType] = useState('fixed');
  const [lateFineAmount, setLateFineAmount] = useState(200);

  // States for Fee Heads tab
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [headFormData, setHeadFormData] = useState({
    name: '',
    code: '',
    type: 'tuition',
    frequency: 'monthly',
    isRefundable: false,
    description: '',
  });

  // States for Concessions tab
  const [concessions, setConcessions] = useState([]);
  const [studentConcessions, setStudentConcessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionFormData, setConcessionFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 25,
    applicableFeeHeads: [],
    description: '',
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    studentId: '',
    concessionId: '',
    customValue: '',
    reason: '',
  });

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [savingStructure, setSavingStructure] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSessionId) {
      fetchClassStructure(selectedClassId, selectedSessionId);
    }
  }, [selectedClassId, selectedSessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sesRes, clsRes, headRes, concRes, stConcRes, stuRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/classes'),
        api.get('/fee-heads'),
        api.get('/fee-concessions'),
        api.get('/fee-concessions/students'),
        api.get('/students', { params: { limit: 100 } }),
      ]);

      const sesList = sesRes?.data?.sessions || sesRes?.data?.data?.sessions || [];
      const clsList = clsRes?.data?.classes || clsRes?.data?.data?.classes || [];
      const heads = headRes?.data?.feeHeads || headRes?.data?.data?.feeHeads || [];

      setSessions(sesList);
      setClasses(clsList);
      setFeeHeads(heads);
      setConcessions(concRes?.data?.concessions || concRes?.data?.data?.concessions || []);
      setStudentConcessions(stConcRes?.data?.studentConcessions || stConcRes?.data?.data?.studentConcessions || []);
      setStudents(stuRes?.data?.students || stuRes?.data?.data?.students || []);

      const activeSes = sesList.find((s) => s.isCurrent) || sesList[0];
      if (activeSes) setSelectedSessionId(activeSes._id);
      if (clsList.length > 0) setSelectedClassId(clsList[0]._id);
    } catch (err) {
      console.error('Failed to load initial fee data:', err);
      setError('Could not load fee structure configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStructure = async (classId, sessionId) => {
    setError(null);
    try {
      const res = await api.get(`/fee-structures/class/${classId}/session/${sessionId}`);
      const struct = res?.data?.feeStructure || res?.data?.data?.feeStructure;

      if (!struct) {
        // No structure configured yet: initialize empty builder template
        setCurrentStructure(null);
        setDueDayOfMonth(10);
        setGracePeriodDays(5);
        setLateFineType('fixed');
        setLateFineAmount(200);
        const emptyMap = {};
        feeHeads.forEach((h) => {
          emptyMap[h._id] = { enabled: false, amount: 0 };
        });
        setClassFeeItems(emptyMap);
        return;
      }

      setCurrentStructure(struct);
      setDueDayOfMonth(struct.dueDayOfMonth || 10);
      setGracePeriodDays(struct.gracePeriodDays || 5);
      setLateFineType(struct.lateFineType || 'fixed');
      setLateFineAmount(struct.lateFineAmount || 200);

      // Build active fee items map
      const itemsMap = {};
      feeHeads.forEach((h) => {
        const found = struct.feeItems?.find((fi) => (fi.feeHead?._id || fi.feeHead) === h._id);
        if (found) {
          itemsMap[h._id] = { enabled: true, amount: found.amount };
        } else {
          itemsMap[h._id] = { enabled: false, amount: 0 };
        }
      });
      setClassFeeItems(itemsMap);
    } catch (err) {
      if (err.status === 404 || err.response?.status === 404) {
        setCurrentStructure(null);
        const emptyMap = {};
        feeHeads.forEach((h) => {
          emptyMap[h._id] = { enabled: false, amount: 0 };
        });
        setClassFeeItems(emptyMap);
      } else {
        setError(err.message || 'Failed to load class fee structure.');
      }
    }
  };

  const handleSaveFeeStructure = async () => {
    if (!selectedSessionId || !selectedClassId) return;
    setSavingStructure(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const feeItemsPayload = Object.keys(classFeeItems)
        .filter((headId) => classFeeItems[headId]?.enabled)
        .map((headId) => ({
          feeHead: headId,
          amount: Number(classFeeItems[headId]?.amount) || 0,
        }));

      const res = await api.post('/fee-structures', {
        academicSession: selectedSessionId,
        class: selectedClassId,
        feeItems: feeItemsPayload,
        dueDayOfMonth: Number(dueDayOfMonth),
        gracePeriodDays: Number(gracePeriodDays),
        lateFineType,
        lateFineAmount: Number(lateFineAmount),
      });

      setCurrentStructure(res.data.data.feeStructure);
      setSuccessMsg(`Fee structure saved for ${classes.find((c) => c._id === selectedClassId)?.name}.`);
    } catch (err) {
      console.error('Save fee structure error:', err);
      setError(err.response?.data?.message || 'Failed to save fee structure.');
    } finally {
      setSavingStructure(false);
    }
  };

  // Fee Head creation
  const handleCreateFeeHead = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/fee-heads', headFormData);
      setFeeHeads((prev) => [...prev, res.data.data.feeHead]);
      setSuccessMsg(`Fee head '${headFormData.name}' created successfully.`);
      setShowHeadModal(false);
      setHeadFormData({
        name: '',
        code: '',
        type: 'tuition',
        frequency: 'monthly',
        isRefundable: false,
        description: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fee head.');
    }
  };

  // Concession creation
  const handleCreateConcession = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/fee-concessions', concessionFormData);
      setConcessions((prev) => [...prev, res.data.data.concession]);
      setSuccessMsg(`Concession template '${concessionFormData.name}' created.`);
      setShowConcessionModal(false);
      setConcessionFormData({
        name: '',
        code: '',
        type: 'percentage',
        value: 25,
        applicableFeeHeads: [],
        description: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create concession.');
    }
  };

  // Assign concession to student
  const handleAssignConcession = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/fee-concessions/assign', {
        ...assignData,
        sessionId: selectedSessionId,
      });
      setStudentConcessions((prev) => [res.data.data.studentConcession, ...prev]);
      setSuccessMsg('Concession assigned to student successfully.');
      setShowAssignModal(false);
      setAssignData({ studentId: '', concessionId: '', customValue: '', reason: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign concession.');
    }
  };

  const handleRevokeConcession = async (id) => {
    try {
      await api.patch(`/fee-concessions/revoke/${id}`);
      setStudentConcessions((prev) =>
        prev.map((sc) => (sc._id === id ? { ...sc, status: 'revoked' } : sc))
      );
      setSuccessMsg('Student concession revoked.');
    } catch (err) {
      setError('Failed to revoke concession.');
    }
  };

  // Calculated totals for current class structure
  let calculatedMonthly = 0;
  let calculatedAnnual = 0;
  feeHeads.forEach((h) => {
    const item = classFeeItems[h._id];
    if (item?.enabled) {
      const amt = Number(item.amount) || 0;
      if (h.frequency === 'monthly') calculatedMonthly += amt;
      if (h.frequency === 'annual') calculatedAnnual += amt;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Fee Structure & Concessions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Section 19: Configure fee heads, class billing rules, late fines, and policy-based student concessions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
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

      {/* TAB 1: Class Fee Structures */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          {/* Selectors & Metrics Banner */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Total Monthly Fee
                </span>
                <span className="text-xl font-bold text-indigo-700 mt-0.5">
                  PKR {calculatedMonthly.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Total Annual Charges
                </span>
                <span className="text-xl font-bold text-emerald-700 mt-0.5">
                  PKR {calculatedAnnual.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Fee Items Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b bg-gray-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Applicable Fee Items</h3>
                <p className="text-xs text-gray-500">
                  Enable fee heads and specify billing amounts for this class.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4 w-12">Enable</th>
                    <th className="py-3 px-4">Fee Head Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Billing Frequency</th>
                    <th className="py-3 px-4">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeHeads.map((h) => {
                    const item = classFeeItems[h._id] || { enabled: false, amount: 0 };
                    return (
                      <tr
                        key={h._id}
                        className={`transition ${item.enabled ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) =>
                              setClassFeeItems({
                                ...classFeeItems,
                                [h._id]: { ...item, enabled: e.target.checked },
                              })
                            }
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{h.name}</td>
                        <td className="py-3 px-4 font-mono text-gray-500">{h.code}</td>
                        <td className="py-3 px-4 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              h.frequency === 'monthly'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {h.frequency}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1.5 text-gray-400 font-medium">Rs</span>
                            <input
                              type="number"
                              disabled={!item.enabled}
                              value={item.amount || ''}
                              onChange={(e) =>
                                setClassFeeItems({
                                  ...classFeeItems,
                                  [h._id]: { ...item, amount: Number(e.target.value) },
                                })
                              }
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Late Fine & Due Date Rules */}
            <div className="p-5 border-t bg-gray-50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Challan Due Date & Late Fine Rules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDayOfMonth}
                    onChange={(e) => setDueDayOfMonth(e.target.value)}
                    className="w-full py-1.5 px-3 border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. 10th of each month</span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(e.target.value)}
                    className="w-full py-1.5 px-3 border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Days before late fine applies</span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Late Fine Policy</label>
                  <select
                    value={lateFineType}
                    onChange={(e) => setLateFineType(e.target.value)}
                    className="w-full py-1.5 px-3 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="fixed">Fixed Fine (One-time)</option>
                    <option value="daily">Daily Incremental Fine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Late Fine Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={lateFineAmount}
                    onChange={(e) => setLateFineAmount(e.target.value)}
                    className="w-full py-1.5 px-3 border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. Rs 200 flat fine</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={handleSaveFeeStructure}
                  disabled={savingStructure}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingStructure ? 'Saving Fee Structure...' : 'Save Class Fee Structure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fee Heads */}
      {activeTab === 'heads' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowHeadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add Fee Head
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Category Type</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Refundable</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeHeads.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{h.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{h.code}</td>
                    <td className="py-3 px-4 capitalize">{h.type}</td>
                    <td className="py-3 px-4 capitalize">{h.frequency}</td>
                    <td className="py-3 px-4">
                      {h.isRefundable ? (
                        <span className="text-emerald-600 font-medium">Yes (Deposit)</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Concessions & Scholarships */}
      {activeTab === 'concessions' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <UserCheck className="w-4 h-4 text-gray-500" />
              Assign Concession to Student
            </button>
            <button
              onClick={() => setShowConcessionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Concession Policy
            </button>
          </div>

          {/* Concession Templates */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b bg-gray-50/60">
              <h3 className="text-sm font-bold text-gray-900">Discount & Scholarship Policies</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
              {concessions.map((c) => (
                <div key={c._id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-xs">{c.name}</span>
                    <span className="font-mono text-[10px] text-gray-400">{c.code}</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-700">
                    {c.type === 'percentage' ? `${c.value}% Off` : `PKR ${c.value} Flat`}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{c.description || 'Standard policy'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Assignments Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b bg-gray-50/60">
              <h3 className="text-sm font-bold text-gray-900">Active Student Concession Grants</h3>
            </div>
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Concession Policy</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentConcessions.map((sc) => (
                  <tr key={sc._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {sc.student?.name}
                      <span className="block font-mono text-[10px] text-gray-400">
                        {sc.student?.studentId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{sc.concession?.name}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {sc.customValue
                        ? `PKR ${sc.customValue}`
                        : sc.concession?.type === 'percentage'
                        ? `${sc.concession?.value}%`
                        : `PKR ${sc.concession?.value}`}
                    </td>
                    <td className="py-3 px-4">{sc.academicSession?.name}</td>
                    <td className="py-3 px-4 text-gray-500">{sc.reason || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sc.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sc.status === 'active' && (
                        <button
                          onClick={() => handleRevokeConcession(sc._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Fee Head Modal */}
      {showHeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create New Fee Head</h3>
              <button onClick={() => setShowHeadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeeHead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fee Head Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Maintenance"
                  value={headFormData.name}
                  onChange={(e) => setHeadFormData({ ...headFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Short Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SLAB"
                  value={headFormData.code}
                  onChange={(e) => setHeadFormData({ ...headFormData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category Type</label>
                  <select
                    value={headFormData.type}
                    onChange={(e) => setHeadFormData({ ...headFormData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="admission">Admission</option>
                    <option value="exam">Examination</option>
                    <option value="lab">Lab / Computer</option>
                    <option value="library">Library</option>
                    <option value="sports">Sports</option>
                    <option value="annual">Annual</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Frequency</label>
                  <select
                    value={headFormData.frequency}
                    onChange={(e) => setHeadFormData({ ...headFormData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="one_time">One-time (Admission)</option>
                    <option value="term">Per Term / Exam</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="refundable"
                  checked={headFormData.isRefundable}
                  onChange={(e) =>
                    setHeadFormData({ ...headFormData, isRefundable: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor="refundable" className="font-medium text-gray-700 cursor-pointer">
                  Refundable Security Deposit
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowHeadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Create Fee Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Concession Policy Modal */}
      {showConcessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create Concession Policy</h3>
              <button onClick={() => setShowConcessionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConcession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Concession Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sibling Discount"
                  value={concessionFormData.name}
                  onChange={(e) =>
                    setConcessionFormData({ ...concessionFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIB-25"
                  value={concessionFormData.code}
                  onChange={(e) =>
                    setConcessionFormData({ ...concessionFormData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={concessionFormData.type}
                    onChange={(e) =>
                      setConcessionFormData({ ...concessionFormData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (PKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={concessionFormData.value}
                    onChange={(e) =>
                      setConcessionFormData({ ...concessionFormData, value: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={concessionFormData.description}
                  onChange={(e) =>
                    setConcessionFormData({ ...concessionFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowConcessionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Concession to Student Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Assign Concession to Student</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignConcession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Student</label>
                <select
                  required
                  value={assignData.studentId}
                  onChange={(e) => setAssignData({ ...assignData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose student --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Concession Policy</label>
                <select
                  required
                  value={assignData.concessionId}
                  onChange={(e) => setAssignData({ ...assignData, concessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose policy --</option>
                  {concessions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type === 'percentage' ? `${c.value}%` : `Rs ${c.value}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Custom Value Override <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="Leave empty to use policy default"
                  value={assignData.customValue}
                  onChange={(e) => setAssignData({ ...assignData, customValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Biological sibling enrolled in Grade 8"
                  value={assignData.reason}
                  onChange={(e) => setAssignData({ ...assignData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Grant Concession
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
