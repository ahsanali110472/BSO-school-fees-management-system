import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Printer,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  Building,
  CreditCard,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  User,
  Check,
  School
} from 'lucide-react';
import api from '../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Challans() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('4'); // Default April
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Generation Modal (Whole School, Class/Section, or Single Student)
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genScope, setGenScope] = useState('school'); // 'school' | 'class' | 'student'
  const [genSession, setGenSession] = useState('');
  const [genClass, setGenClass] = useState('');
  const [genSection, setGenSection] = useState('');
  const [genMonth, setGenMonth] = useState('4');
  const [genYear, setGenYear] = useState('2026');
  const [genDueDate, setGenDueDate] = useState('2026-04-10');
  const [includeAnnual, setIncludeAnnual] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Single Student Search in Generation Modal
  const [genStudentSearch, setGenStudentSearch] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Print Preview Modal (3-Copy Bank Challan)
  const [selectedChallan, setSelectedChallan] = useState(null);

  // Void Modal
  const [voidModalChallan, setVoidModalChallan] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchChallans();
  }, [page, limit, selectedSession, selectedClass, selectedSection, selectedMonth, selectedYear, selectedStatus]);

  const fetchLookups = async () => {
    try {
      const [clsRes, secRes, sesRes] = await Promise.all([
        api.get('/classes'),
        api.get('/sections'),
        api.get('/sessions'),
      ]);
      const clsList = clsRes?.data?.classes || clsRes?.data?.data?.classes || [];
      const secList = secRes?.data?.sections || secRes?.data?.data?.sections || [];
      const sesList = sesRes?.data?.sessions || sesRes?.data?.data?.sessions || [];

      setClasses(clsList);
      setSections(secList);
      setSessions(sesList);

      const activeSes = sesList.find((s) => s.isCurrent);
      if (activeSes) {
        setSelectedSession(activeSes._id);
        setGenSession(activeSes._id);
      }
    } catch (err) {
      console.error('Failed to load filter lookups:', err);
    }
  };

  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        sessionId: selectedSession || undefined,
        classId: selectedClass || undefined,
        sectionId: selectedSection || undefined,
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
        status: selectedStatus || undefined,
      };

      const res = await api.get('/challans', { params });
      const chList = res?.data?.challans || res?.data?.data?.challans || [];
      const pag = res?.data?.pagination || res?.data?.data?.pagination || { total: 0, pages: 1 };
      setChallans(chList);
      setPagination(pag);
    } catch (err) {
      console.error('Failed to fetch challans:', err);
      setError(err.message || 'Failed to load fee challans.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchChallans();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedMonth('');
    setSelectedStatus('');
    setPage(1);
    fetchChallans();
  };

  const handleStudentSearch = async (query) => {
    setGenStudentSearch(query);
    if (!query || query.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const res = await api.get('/students', {
        params: { search: query.trim(), limit: 8, status: 'active' },
      });
      const list = res?.data?.students || res?.data?.data?.students || [];
      setStudentSearchResults(list);
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const payload = {
        academicSessionId: genSession,
        billingMonth: Number(genMonth),
        billingYear: Number(genYear),
        dueDate: genDueDate ? new Date(genDueDate) : undefined,
        includeAnnualFees: includeAnnual,
      };

      if (genScope === 'class') {
        if (!genClass) {
          setError('Please select a target class.');
          setGenerating(false);
          return;
        }
        payload.classId = genClass;
        if (genSection) payload.sectionId = genSection;
      } else if (genScope === 'student') {
        if (!selectedStudent) {
          setError('Please search and select a student.');
          setGenerating(false);
          return;
        }
        payload.studentId = selectedStudent._id;
        if (selectedStudent.currentEnrollment?.class?._id) {
          payload.classId = selectedStudent.currentEnrollment.class._id;
        }
      }
      // If genScope === 'school', neither classId nor studentId is passed, generating for whole school!

      const res = await api.post('/challans/generate', payload);

      setSuccessMsg(res.data.message || 'Challans generated successfully.');
      setShowGenerateModal(false);
      setSelectedStudent(null);
      setGenStudentSearch('');
      setStudentSearchResults([]);
      fetchChallans();
    } catch (err) {
      console.error('Batch generation failed:', err);
      setError(err.response?.data?.message || 'Failed to generate challans.');
    } finally {
      setGenerating(false);
    }
  };

  const handleVoidChallan = async (e) => {
    e.preventDefault();
    if (!voidModalChallan) return;
    setVoiding(true);
    try {
      await api.patch(`/challans/${voidModalChallan._id}/void`, {
        reason: voidReason,
      });
      setSuccessMsg(`Challan ${voidModalChallan.challanNumber} voided.`);
      setVoidModalChallan(null);
      setVoidReason('');
      fetchChallans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to void challan.');
    } finally {
      setVoiding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Paid</span>;
      case 'unpaid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">Unpaid</span>;
      case 'partially_paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Partial</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">Overdue</span>;
      case 'void':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 line-through">Void</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Metrics
  const totalBilled = challans.reduce((sum, c) => sum + (c.status !== 'void' ? c.totalPayable : 0), 0);
  const totalCollected = challans.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalOutstanding = challans.reduce((sum, c) => sum + (c.status !== 'void' ? c.balanceAmount : 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Fee Challans & Vouchers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Section 20 & 21: Automated monthly billing, arrears rollover, concessions, and 3-copy printable bank vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Monthly Challans
          </button>
          <button
            onClick={fetchChallans}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">
            PKR {totalBilled.toLocaleString()}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Active challans sum</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Collected
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            PKR {totalCollected.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-500 mt-1 block">Verified bank deposits</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Outstanding Due
          </span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">
            PKR {totalOutstanding.toLocaleString()}
          </span>
          <span className="text-[11px] text-red-400 mt-1 block">Pending payment</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Challans
          </span>
          <span className="text-2xl font-bold text-indigo-600 mt-1 block">
            {pagination.total}
          </span>
          <span className="text-[11px] text-indigo-400 mt-1 block">Vouchers issued</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, father name, admission #, roll #, or challan #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
          {(search || selectedClass || selectedSection || selectedStatus || selectedMonth) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-gray-100 text-xs">
          <div>
            <label className="block font-semibold text-gray-500 mb-1">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Sections</option>
              {sections
                .filter((s) => !selectedClass || s.class?._id === selectedClass || s.class === selectedClass)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Billing Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Challan #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class / Section</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Payable by Due</th>
                <th className="py-3 px-4">After Due</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading fee challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400 space-y-2">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm font-medium text-gray-800">No challans found</p>
                    <p className="text-xs text-gray-500">
                      Generate monthly billing vouchers using the button above.
                    </p>
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch._id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {ch.challanNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-gray-900 block">{ch.student?.name}</span>
                        <span className="text-gray-400 text-[11px] font-mono">
                          ID: {ch.student?.studentId} | Roll: {ch.rollNumber || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{ch.class?.name}</span>
                      <span className="block text-gray-400 text-[11px]">
                        {ch.section?.name ? `Sec ${ch.section.name}` : 'Sec A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{ch.monthName}</td>
                    <td className="py-3 px-4">
                      {new Date(ch.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      PKR {ch.totalPayable.toLocaleString()}
                      {ch.concessionAmount > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          (-{ch.concessionAmount} discount)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      PKR {ch.totalPayableAfterDue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      PKR {ch.balanceAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ch.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ch.status !== 'paid' && ch.status !== 'void' && (
                          <button
                            onClick={() => navigate('/payments', { state: { collectChallan: ch } })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
                            title="Collect fee payment for this challan"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Collect
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedChallan(ch)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-xs transition"
                          title="Print 3-Copy Bank Voucher"
                        >
                          <Printer className="w-3.5 h-3.5 text-gray-500" />
                          Print
                        </button>
                        {ch.status !== 'void' && ch.paidAmount === 0 && (
                          <button
                            onClick={() => setVoidModalChallan(ch)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-md transition"
                            title="Void Challan"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div>
            Showing {challans.length === 0 ? 0 : (page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, pagination.total)} of {pagination.total} challans
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-800">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch & Single Challan Generation Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Generate Fee Challans</h3>
                <p className="text-xs text-gray-500">Issue monthly billing vouchers for school, class, or individual student</p>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedStudent(null);
                  setGenStudentSearch('');
                  setStudentSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBatch} className="space-y-4 text-xs">
              {/* Generation Scope Selector */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">1. Select Generation Scope</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setGenScope('school')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition ${
                      genScope === 'school'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Whole School</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenScope('class')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition ${
                      genScope === 'class'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Class & Sec</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenScope('student')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition ${
                      genScope === 'student'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Single Student</span>
                  </button>
                </div>
              </div>

              {/* Scope A: Whole School Info Box */}
              {genScope === 'school' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 flex items-start gap-2.5">
                  <School className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">All Classes & Active Enrolled Students</span>
                    <span className="text-[11px] text-indigo-700">
                      Generates monthly challans for every enrolled student across all classes with active fee structures. Existing challans for this billing month will be safely skipped.
                    </span>
                  </div>
                </div>
              )}

              {/* Scope B: Class & Section Fields */}
              {genScope === 'class' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Target Class <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={genClass}
                      onChange={(e) => {
                        setGenClass(e.target.value);
                        setGenSection('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-medium"
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Section <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={genSection}
                      onChange={(e) => setGenSection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">All Sections</option>
                      {sections
                        .filter((s) => !genClass || s.class?._id === genClass || s.class === genClass)
                        .map((s) => (
                          <option key={s._id} value={s._id}>
                            Section {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Scope C: Single Student Search */}
              {genScope === 'student' && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <label className="block font-semibold text-gray-700">
                    Search Student <span className="text-rose-500">*</span>
                  </label>

                  {selectedStudent ? (
                    <div className="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-xl">
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">{selectedStudent.name}</span>
                        <div className="text-[11px] text-gray-500 flex gap-2">
                          <span>Adm #: <strong className="text-gray-700">{selectedStudent.admissionNumber || '—'}</strong></span>
                          <span>Roll #: <strong className="text-gray-700">{selectedStudent.rollNumber || '—'}</strong></span>
                          {selectedStudent.father?.name && <span>Father: <strong>{selectedStudent.father.name}</strong></span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          value={genStudentSearch}
                          onChange={(e) => handleStudentSearch(e.target.value)}
                          placeholder="Type student name, roll number, or admission #..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchingStudents && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin absolute right-3 top-3 text-gray-400" />
                        )}
                      </div>

                      {studentSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 divide-y divide-gray-100">
                          {studentSearchResults.map((st) => (
                            <button
                              key={st._id}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(st);
                                setGenStudentSearch('');
                                setStudentSearchResults([]);
                              }}
                              className="w-full text-left p-2.5 hover:bg-indigo-50 transition flex items-center justify-between"
                            >
                              <div>
                                <span className="font-semibold text-gray-900 block">{st.name}</span>
                                <span className="text-[10px] text-gray-500">
                                  Adm: {st.admissionNumber || '—'} | Roll: {st.rollNumber || '—'} | Father: {st.father?.name || '—'}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {genStudentSearch.length >= 2 && studentSearchResults.length === 0 && !searchingStudents && (
                        <div className="p-2 text-center text-gray-400 text-xs bg-white border rounded-lg mt-1">
                          No active students found matching "{genStudentSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Common Session, Billing Month & Year */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">2. Academic Session</label>
                <select
                  required
                  value={genSession}
                  onChange={(e) => setGenSession(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Month</label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Year</label>
                  <input
                    type="number"
                    value={genYear}
                    onChange={(e) => setGenYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={genDueDate}
                  onChange={(e) => setGenDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeAnn"
                  checked={includeAnnual}
                  onChange={(e) => setIncludeAnnual(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor="includeAnn" className="text-gray-700 cursor-pointer">
                  Include Annual Charges in this billing cycle
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedStudent(null);
                    setGenStudentSearch('');
                    setStudentSearchResults([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || (genScope === 'student' && !selectedStudent)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 shadow-sm"
                >
                  {generating
                    ? 'Generating Challans...'
                    : genScope === 'school'
                    ? 'Generate for Whole School'
                    : genScope === 'class'
                    ? 'Generate for Class'
                    : 'Generate for Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable 3-Copy Bank Challan Modal */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-base font-bold text-gray-900">
                Print 3-Copy Bank Challan Voucher ({selectedChallan.challanNumber})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print A4 Voucher
                </button>
                <button
                  onClick={() => setSelectedChallan(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3-Copy Container: Designed to print 3 identical vertical slips across A4 Landscape or Portrait */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-2 border-dashed border-gray-300 p-3 bg-white">
              {['BANK COPY', 'SCHOOL / ACCOUNTS COPY', 'STUDENT / PARENT COPY'].map((copyType, idx) => (
                <div
                  key={copyType}
                  className={`p-3 border rounded-lg text-[10px] space-y-2 ${
                    idx < 2 ? 'border-r-2 border-dashed border-gray-400' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="text-center border-b pb-1.5">
                    <h4 className="font-bold uppercase tracking-wider text-xs text-indigo-950 font-serif">
                      BSO MODEL HIGH SCHOOL
                    </h4>
                    <span className="font-semibold text-[9px] text-gray-500 block">
                      North Karachi Campus, Karachi
                    </span>
                    <span className="mt-1 px-2 py-0.5 bg-indigo-900 text-white font-bold rounded text-[9px] inline-block tracking-wider">
                      {copyType}
                    </span>
                  </div>

                  {/* Bank Accounts Info */}
                  <div className="bg-gray-50 p-1.5 rounded border border-gray-200 text-[9px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-700">Meezan Bank:</span>
                      <span className="font-mono">0101-0102030405</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-700">Habib Bank Ltd:</span>
                      <span className="font-mono">2201-9988776655</span>
                    </div>
                  </div>

                  {/* Challan & Student Metadata */}
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Challan #:</span>
                      <span className="font-mono font-bold text-indigo-900">{selectedChallan.challanNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Billing Period:</span>
                      <span className="font-semibold">{selectedChallan.monthName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due Date:</span>
                      <span className="font-bold text-red-600">
                        {new Date(selectedChallan.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-gray-500">Student Name:</span>
                      <span className="font-bold text-gray-900">{selectedChallan.student?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Student ID:</span>
                      <span className="font-mono">{selectedChallan.student?.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Class / Section:</span>
                      <span>
                        {selectedChallan.class?.name} ({selectedChallan.section?.name ? `Sec ${selectedChallan.section.name}` : 'Sec A'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Roll No:</span>
                      <span>{selectedChallan.rollNumber || '01'}</span>
                    </div>
                  </div>

                  {/* Itemized Fee Breakdown */}
                  <div className="border-t pt-1">
                    <table className="w-full text-left text-[9px]">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-0.5">Description</th>
                          <th className="pb-0.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedChallan.feeItems?.map((item) => (
                          <tr key={item.headName}>
                            <td className="py-0.5">{item.headName}</td>
                            <td className="py-0.5 text-right font-mono">Rs {item.amount}</td>
                          </tr>
                        ))}
                        {selectedChallan.concessionAmount > 0 && (
                          <tr className="text-emerald-700">
                            <td className="py-0.5">Fee Concession</td>
                            <td className="py-0.5 text-right font-mono">
                              -Rs {selectedChallan.concessionAmount}
                            </td>
                          </tr>
                        )}
                        {selectedChallan.arrears > 0 && (
                          <tr className="text-red-600 font-semibold">
                            <td className="py-0.5">Previous Arrears</td>
                            <td className="py-0.5 text-right font-mono">
                              Rs {selectedChallan.arrears}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-1 space-y-1">
                    <div className="flex justify-between font-bold text-xs bg-indigo-50 p-1 rounded">
                      <span>Payable by Due Date:</span>
                      <span className="text-indigo-900">Rs {selectedChallan.totalPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Late Fine after due:</span>
                      <span>Rs {selectedChallan.lateFineAmount}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[10px] text-red-700">
                      <span>Payable after Due Date:</span>
                      <span>Rs {selectedChallan.totalPayableAfterDue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Instructions & Signature */}
                  <div className="pt-2 text-[8px] text-gray-500 border-t space-y-3">
                    <p>
                      * Valid for deposit at all designated online branches in Pakistan. Non-refundable.
                    </p>
                    <div className="flex justify-between items-end pt-3 text-[8px] text-gray-600">
                      <div className="text-center">
                        <div className="w-16 border-b border-gray-400 mb-0.5" />
                        <span>Depositor</span>
                      </div>
                      <div className="text-center">
                        <div className="w-16 border-b border-gray-400 mb-0.5" />
                        <span>Cashier / Stamp</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidModalChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Void Fee Challan</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel challan {voidModalChallan.challanNumber} for {voidModalChallan.student?.name}?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for cancellation</label>
              <textarea
                rows="2"
                required
                placeholder="e.g. Student transferred, duplicate billing, concession adjustment"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setVoidModalChallan(null)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVoidChallan}
                disabled={voiding}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {voiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
