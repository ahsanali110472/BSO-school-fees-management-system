import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  RotateCcw,
  Calendar,
  CreditCard,
  Building2,
  User,
  Clock,
  Filter,
  ArrowRight,
  School,
  Users,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Payments() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Active View Tab: 'desk' (Pending Fee Collection Desk) | 'ledger' (Payment Receipts Ledger)
  const [activeTab, setActiveTab] = useState('desk');

  // Lookups
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Data states (Ledger)
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Filters (Ledger)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'today', 'month'

  // Modals
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState(null);
  const [reversalReason, setReversalReason] = useState('');

  // Pending Fee Collection Desk States (Class / School Roster)
  const [deskSession, setDeskSession] = useState('');
  const [deskClass, setDeskClass] = useState('');
  const [deskSection, setDeskSection] = useState('');
  const [deskMonth, setDeskMonth] = useState('4'); // Default current month April
  const [deskYear, setDeskYear] = useState('2026');
  const [deskSearch, setDeskSearch] = useState('');
  const [deskChallans, setDeskChallans] = useState([]);
  const [loadingDesk, setLoadingDesk] = useState(false);
  const [deskPage, setDeskPage] = useState(1);
  const [deskPagination, setDeskPagination] = useState({ total: 0, pages: 1 });

  // Collect Payment Modal Form States
  const [findMode, setFindMode] = useState('student'); // 'student' | 'class' | 'voucher'
  const [finderStudentQuery, setFinderStudentQuery] = useState('');
  const [finderStudentResults, setFinderStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const [finderClass, setFinderClass] = useState('');
  const [finderSection, setFinderSection] = useState('');
  const [finderClassChallans, setFinderClassChallans] = useState([]);
  const [loadingClassChallans, setLoadingClassChallans] = useState(false);

  const [challanQuery, setChallanQuery] = useState('');
  const [searchingChallan, setSearchingChallan] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('cash');
  const [collectBankName, setCollectBankName] = useState('');
  const [collectTxnId, setCollectTxnId] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collectError, setCollectError] = useState('');

  // Load Lookups on mount
  useEffect(() => {
    fetchLookups();
  }, []);

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
        setDeskSession(activeSes._id);
      }
    } catch (err) {
      console.error('Failed to load filter lookups:', err);
    }
  };

  // Check navigation state from Challans page
  useEffect(() => {
    if (location.state?.collectChallan) {
      const ch = location.state.collectChallan;
      setSelectedChallan(ch);
      setCollectAmount(String(ch.balanceAmount));
      setShowCollectModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/payments/summary');
      const data = res?.data || res?.data?.data;
      if (data) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch payment summary:', err);
    }
  }, []);

  // Fetch payments list (Ledger)
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        paymentMethod: methodFilter || undefined,
        status: statusFilter || undefined,
      };

      if (dateRangeFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.startDate = today;
        params.endDate = today;
      } else if (dateRangeFilter === 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        params.startDate = start;
        params.endDate = end;
      }

      const res = await api.get('/payments', { params });
      const payList = res?.data?.payments || res?.data?.data?.payments || [];
      const pag = res?.data?.pagination || res?.data?.data?.pagination || { pages: 1, total: 0 };
      setPayments(payList);
      setTotalPages(pag.pages || 1);
      setTotalRecords(pag.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter, statusFilter, dateRangeFilter]);

  // Fetch Pending Fee Collection Desk Challans
  const fetchDeskChallans = useCallback(async () => {
    setLoadingDesk(true);
    try {
      const params = {
        page: deskPage,
        limit: 25,
        sessionId: deskSession || undefined,
        classId: deskClass || undefined,
        sectionId: deskSection || undefined,
        month: deskMonth || undefined,
        year: deskYear || undefined,
        search: deskSearch.trim() || undefined,
        status: 'pending', // Unpaid and partially paid
      };

      const res = await api.get('/challans', { params });
      const chList = res?.data?.challans || res?.data?.data?.challans || [];
      const pag = res?.data?.pagination || res?.data?.data?.pagination || { total: 0, pages: 1 };
      setDeskChallans(chList);
      setDeskPagination(pag);
    } catch (err) {
      console.error('Failed to load pending fee desk:', err);
    } finally {
      setLoadingDesk(false);
    }
  }, [deskPage, deskSession, deskClass, deskSection, deskMonth, deskYear, deskSearch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchDeskChallans();
  }, [fetchDeskChallans]);

  // Live Student Search in Collect Modal
  const handleModalStudentSearch = async (query) => {
    setFinderStudentQuery(query);
    if (!query || query.trim().length < 2) {
      setFinderStudentResults([]);
      return;
    }
    setSearchingStudents(true);
    setCollectError('');
    try {
      const res = await api.get('/challans', {
        params: {
          search: query.trim(),
          status: 'pending',
          limit: 8,
        },
      });
      const list = res?.data?.challans || res?.data?.data?.challans || [];
      setFinderStudentResults(list);
    } catch (err) {
      console.error('Error searching student challans:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Class Selection in Collect Modal
  const handleModalClassChange = async (clsId, secId) => {
    setFinderClass(clsId);
    setFinderSection(secId);
    if (!clsId) {
      setFinderClassChallans([]);
      return;
    }
    setLoadingClassChallans(true);
    setCollectError('');
    try {
      const params = {
        classId: clsId,
        sectionId: secId || undefined,
        status: 'pending',
        limit: 30,
      };
      const res = await api.get('/challans', { params });
      const list = res?.data?.challans || res?.data?.data?.challans || [];
      setFinderClassChallans(list);
    } catch (err) {
      console.error('Error fetching class challans:', err);
    } finally {
      setLoadingClassChallans(false);
    }
  };

  const selectChallanForCollection = (ch) => {
    if (ch.status === 'void') {
      setCollectError(`Challan ${ch.challanNumber} is VOID and cannot accept payments.`);
      return;
    }
    if (ch.balanceAmount <= 0) {
      setCollectError(`Challan ${ch.challanNumber} has already been fully paid.`);
      return;
    }
    setSelectedChallan(ch);
    setCollectAmount(String(ch.balanceAmount));
    setCollectError('');
  };

  // Search Challan by exact Voucher / Student ID
  const handleSearchChallan = async (e) => {
    e.preventDefault();
    if (!challanQuery.trim()) return;

    setSearchingChallan(true);
    setCollectError('');
    setSelectedChallan(null);

    try {
      const query = challanQuery.trim();
      const res = await api.get('/challans', {
        params: { search: query, limit: 1 },
      });

      const challansList = res?.data?.challans || res?.data?.data?.challans || [];
      if (challansList.length > 0) {
        selectChallanForCollection(challansList[0]);
      } else {
        setCollectError(`No active challan found matching "${query}".`);
      }
    } catch (err) {
      setCollectError(err.message || 'Error locating challan.');
    } finally {
      setSearchingChallan(false);
    }
  };

  // Submit recorded payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedChallan) {
      setCollectError('Please search and select an active challan first.');
      return;
    }

    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      setCollectError('Please enter a valid positive payment amount.');
      return;
    }

    if (amt > selectedChallan.balanceAmount) {
      setCollectError(`Payment amount (PKR ${amt.toLocaleString()}) cannot exceed the remaining balance (PKR ${selectedChallan.balanceAmount.toLocaleString()}).`);
      return;
    }

    setActionLoading(true);
    setCollectError('');
    try {
      const payload = {
        challanId: selectedChallan._id,
        amount: amt,
        paymentMethod: collectMethod,
        bankName: collectBankName.trim() || undefined,
        transactionId: collectTxnId.trim() || undefined,
        notes: collectNotes.trim() || undefined,
        paymentDate: new Date(),
      };

      const res = await api.post('/payments', payload);
      const paymentObj = res?.data?.payment || res?.data?.data?.payment;
      setSuccess(`Payment of PKR ${amt.toLocaleString()} recorded! Receipt ${paymentObj?.receiptNumber || ''} issued.`);
      setShowCollectModal(false);
      resetCollectForm();
      fetchPayments();
      fetchSummary();
      fetchDeskChallans();

      if (paymentObj) {
        setSelectedReceipt(paymentObj);
        setShowReceiptModal(true);
      }
    } catch (err) {
      setCollectError(err.message || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reversal
  const handleReversePayment = async (e) => {
    e.preventDefault();
    if (!paymentToReverse) return;
    if (!reversalReason.trim()) {
      setError('Please provide a mandatory reason for reversing this payment.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/payments/${paymentToReverse._id}/reverse`, {
        reversalReason: reversalReason.trim(),
      });
      setSuccess(`Payment receipt ${paymentToReverse.receiptNumber} was successfully reversed.`);
      setShowReverseModal(false);
      setPaymentToReverse(null);
      setReversalReason('');
      fetchPayments();
      fetchSummary();
      fetchDeskChallans();
    } catch (err) {
      setError(err.message || 'Failed to reverse payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetCollectForm = () => {
    setChallanQuery('');
    setSelectedChallan(null);
    setCollectAmount('');
    setCollectMethod('cash');
    setCollectBankName('');
    setCollectTxnId('');
    setCollectNotes('');
    setCollectError('');
    setFinderStudentQuery('');
    setFinderStudentResults([]);
    setFinderClass('');
    setFinderSection('');
    setFinderClassChallans([]);
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'bank_transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'easypaisa':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'jazzcash':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cheque':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'easypaisa':
        return 'Easypaisa';
      case 'jazzcash':
        return 'JazzCash';
      case 'cheque':
        return 'Cheque';
      default:
        return 'Other';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Receipt Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-area, #printable-receipt-area * {
            visibility: visible;
          }
          #printable-receipt-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: sans-serif;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            Fee Collection & Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Record counter fee payments, bank reconciliation, partial installments, and print official payment receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetCollectForm();
              setShowCollectModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Collect Fee Payment
          </button>
        </div>
      </div>

      {/* Toast Messages */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collection */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Today's Collection
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 block">
              PKR {(summary?.today?.total || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {summary?.today?.count || 0} transactions processed today
            </span>
          </div>
        </div>

        {/* Month's Collection */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Month's Collection
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600 block">
              PKR {(summary?.month?.total || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-blue-500 mt-1 block">
              {summary?.month?.count || 0} transactions this month
            </span>
          </div>
        </div>

        {/* Cash vs Bank / Online */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Cash vs Bank/Online
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Cash:</span>
              <span className="font-semibold text-gray-900">
                PKR {(summary?.breakdown?.cash || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Bank / Digital:</span>
              <span className="font-semibold text-emerald-600">
                PKR {((summary?.breakdown?.bank_transfer || 0) + (summary?.breakdown?.easypaisa || 0) + (summary?.breakdown?.jazzcash || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Reversals & Audits */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Reversals & Audits
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-600 block">
              {summary?.reversalsCount || 0}
            </span>
            <span className="text-[11px] text-rose-400 mt-1 block">
              Audited reversed transactions
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('desk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
            activeTab === 'desk'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Pending Dues Roster (By Class & School)</span>
          {deskPagination.total > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'desk' ? 'bg-indigo-700 text-indigo-100' : 'bg-rose-100 text-rose-700'
            }`}>
              {deskPagination.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
            activeTab === 'ledger'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Transactions Ledger</span>
          {totalRecords > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'ledger' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-600'
            }`}>
              {totalRecords}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: PENDING DUES ROSTER (BY CLASS & SCHOOL) */}
      {activeTab === 'desk' && (
        <div className="space-y-4">
          {/* Desk Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={deskSearch}
                  onChange={(e) => {
                    setDeskSearch(e.target.value);
                    setDeskPage(1);
                  }}
                  placeholder="Search student name, roll #, admission #, father name, or challan #..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchDeskChallans()}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDesk ? 'animate-spin' : ''}`} />
                Refresh Dues
              </button>
              {(deskSearch || deskClass || deskSection || deskMonth) && (
                <button
                  type="button"
                  onClick={() => {
                    setDeskSearch('');
                    setDeskClass('');
                    setDeskSection('');
                    setDeskMonth('');
                    setDeskPage(1);
                  }}
                  className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-gray-100 text-xs">
              <div>
                <label className="block font-semibold text-gray-500 mb-1">Session</label>
                <select
                  value={deskSession}
                  onChange={(e) => {
                    setDeskSession(e.target.value);
                    setDeskPage(1);
                  }}
                  className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">All Sessions</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.isCurrent ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-500 mb-1">Class</label>
                <select
                  value={deskClass}
                  onChange={(e) => {
                    setDeskClass(e.target.value);
                    setDeskSection('');
                    setDeskPage(1);
                  }}
                  className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-900 font-medium"
                >
                  <option value="">All Classes (Whole School)</option>
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
                  value={deskSection}
                  onChange={(e) => {
                    setDeskSection(e.target.value);
                    setDeskPage(1);
                  }}
                  className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">All Sections</option>
                  {sections
                    .filter((s) => !deskClass || s.class?._id === deskClass || s.class === deskClass)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        Section {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-500 mb-1">Billing Month</label>
                <select
                  value={deskMonth}
                  onChange={(e) => {
                    setDeskMonth(e.target.value);
                    setDeskPage(1);
                  }}
                  className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-900"
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
                <label className="block font-semibold text-gray-500 mb-1">Billing Year</label>
                <select
                  value={deskYear}
                  onChange={(e) => {
                    setDeskYear(e.target.value);
                    setDeskPage(1);
                  }}
                  className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desk Summary Banner */}
          <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="font-semibold text-gray-800">
                Found {deskPagination.total} student{deskPagination.total === 1 ? '' : 's'} with pending fees
                {deskClass ? ` in ${classes.find(c => c._id === deskClass)?.name || 'selected class'}` : ' across school'}.
              </span>
            </div>
            <div className="text-gray-600">
              Total Outstanding: <strong className="text-red-600 text-sm font-bold">
                PKR {deskChallans.reduce((sum, c) => sum + (c.balanceAmount || 0), 0).toLocaleString()}
              </strong> (on current page)
            </div>
          </div>

          {/* Desk Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 font-semibold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Student & Parent</th>
                    <th className="py-3.5 px-4">Class / Section</th>
                    <th className="py-3.5 px-4">Challan #</th>
                    <th className="py-3.5 px-4">Billing Month</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Total Fee</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {loadingDesk ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Loading pending fee roster...
                      </td>
                    </tr>
                  ) : deskChallans.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-gray-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                        <p className="text-base font-semibold text-gray-800">No Pending Dues!</p>
                        <p className="text-xs text-gray-500 mt-1">All students in this filter have cleared their fee vouchers.</p>
                      </td>
                    </tr>
                  ) : (
                    deskChallans.map((ch) => (
                      <tr key={ch._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 text-xs">{ch.student?.name}</div>
                          <div className="text-[11px] text-gray-400">
                            Adm: {ch.student?.admissionNumber || '—'} | Roll: {ch.rollNumber || '—'}
                            {ch.student?.father?.name && ` • Father: ${ch.student.father.name}`}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{ch.class?.name || '—'}</span>
                          <span className="text-[11px] text-gray-400 block">
                            {ch.section?.name ? `Sec ${ch.section.name}` : 'Sec A'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600 text-[11px]">
                          {ch.challanNumber}
                        </td>

                        <td className="py-3 px-4 font-medium text-gray-800">
                          {ch.monthName}
                        </td>

                        <td className="py-3 px-4 text-gray-600">
                          {new Date(ch.dueDate).toLocaleDateString('en-GB')}
                        </td>

                        <td className="py-3 px-4 text-right text-gray-900 font-medium">
                          PKR {ch.totalPayable.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                          PKR {ch.paidAmount.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-red-600">
                          PKR {ch.balanceAmount.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {ch.status === 'partially_paid' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                              Unpaid
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              selectChallanForCollection(ch);
                              setShowCollectModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Collect Fee
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Desk Pagination */}
            <div className="py-3 px-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {deskChallans.length} of {deskPagination.total} students with dues
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeskPage((p) => Math.max(1, p - 1))}
                  disabled={deskPage <= 1 || loadingDesk}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {deskPage} of {deskPagination.pages || 1}
                </span>
                <button
                  onClick={() => setDeskPage((p) => Math.min(deskPagination.pages || 1, p + 1))}
                  disabled={deskPage >= (deskPagination.pages || 1) || loadingDesk}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PAYMENTS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by Receipt #, Challan #, Student or Txn ID..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Date Range Quick Filter */}
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="month">Current Month</option>
              </select>

              {/* Payment Method */}
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearch('');
                  setMethodFilter('');
                  setStatusFilter('');
                  setDateRangeFilter('all');
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 font-semibold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Challan Ref</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
                        <p>Loading payments ledger...</p>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-gray-400">
                        <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-base font-medium text-gray-600">No payment transactions found</p>
                        <p className="text-xs text-gray-400 mt-1">Try resetting filters or record a fee payment.</p>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Receipt No */}
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {p.receiptNumber}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Student */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{p.student?.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {p.student?.studentId} {p.student?.admissionNumber ? `• ADM: ${p.student.admissionNumber}` : ''}
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-4 text-gray-600">
                          {p.class?.name || '—'}
                        </td>

                        {/* Challan Ref */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-gray-700">{p.challan?.challanNumber}</span>
                          <div className="text-[11px] text-gray-400">{p.challan?.monthName}</div>
                        </td>

                        {/* Method */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getMethodBadgeClass(p.paymentMethod)}`}>
                            {getMethodLabel(p.paymentMethod)}
                          </span>
                          {p.transactionId && (
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              Txn: {p.transactionId}
                            </div>
                          )}
                        </td>

                        {/* Amount Paid */}
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          PKR {p.amount.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {p.status === 'completed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span
                              title={p.reversal?.reversalReason ? `Reason: ${p.reversal.reversalReason}` : 'Reversed'}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                            >
                              Reversed
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedReceipt(p);
                                setShowReceiptModal(true);
                              }}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                              title="View & Print Official Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {p.status === 'completed' && ['super_admin', 'accountant'].includes(user?.role) && (
                              <button
                                onClick={() => {
                                  setPaymentToReverse(p);
                                  setReversalReason('');
                                  setShowReverseModal(true);
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                                title="Reverse Payment"
                              >
                                <RotateCcw className="w-4 h-4" />
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

            {/* Pagination Bar */}
            <div className="py-3 px-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {payments.length} of {totalRecords} payments
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK COLLECT PAYMENT MODAL */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Collect Fee Payment</h3>
                  <p className="text-xs text-gray-500">Scan or search Challan, verify balance, and issue receipt</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCollectModal(false);
                  resetCollectForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: Find Challan (Shown when no challan selected yet) */}
              {!selectedChallan && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      1. Select or Search Student Fee
                    </label>
                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-3">
                      <button
                        type="button"
                        onClick={() => setFindMode('student')}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                          findMode === 'student'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Student Search</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFindMode('class')}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                          findMode === 'class'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>By Class & Sec</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFindMode('voucher')}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                          findMode === 'voucher'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Voucher #</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Student Search */}
                  {findMode === 'student' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          value={finderStudentQuery}
                          onChange={(e) => handleModalStudentSearch(e.target.value)}
                          placeholder="Type student name (e.g. Ali), roll number, or father's name..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        {searchingStudents && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin absolute right-3 top-3 text-gray-400" />
                        )}
                      </div>

                      {finderStudentResults.length > 0 && (
                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto bg-white shadow-xs">
                          {finderStudentResults.map((ch) => (
                            <div
                              key={ch._id}
                              className="p-3 hover:bg-gray-50 flex items-center justify-between transition"
                            >
                              <div>
                                <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                                  <span>{ch.student?.name}</span>
                                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                    {ch.class?.name || '—'} {ch.section?.name ? `(${ch.section.name})` : ''}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  Challan: <strong className="font-mono text-gray-700">{ch.challanNumber}</strong> ({ch.monthName})
                                  {ch.student?.father?.name && ` • Father: ${ch.student.father.name}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-red-600">
                                  PKR {ch.balanceAmount.toLocaleString()}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectChallanForCollection(ch)}
                                  className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                                >
                                  Collect Fee
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {finderStudentQuery.length >= 2 && finderStudentResults.length === 0 && !searchingStudents && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500">
                          No pending fee challans found matching "{finderStudentQuery}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode B: Browse By Class & Section */}
                  {findMode === 'class' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Class</label>
                          <select
                            value={finderClass}
                            onChange={(e) => handleModalClassChange(e.target.value, finderSection)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900"
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
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Section</label>
                          <select
                            value={finderSection}
                            onChange={(e) => handleModalClassChange(finderClass, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900"
                          >
                            <option value="">All Sections</option>
                            {sections
                              .filter((s) => !finderClass || s.class?._id === finderClass || s.class === finderClass)
                              .map((s) => (
                                <option key={s._id} value={s._id}>
                                  Section {s.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {loadingClassChallans && (
                        <div className="py-4 text-center text-xs text-gray-400">
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto text-indigo-600 mb-1" />
                          Loading class students...
                        </div>
                      )}

                      {finderClass && !loadingClassChallans && finderClassChallans.length > 0 && (
                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto bg-white shadow-xs">
                          {finderClassChallans.map((ch) => (
                            <div
                              key={ch._id}
                              className="p-3 hover:bg-gray-50 flex items-center justify-between transition"
                            >
                              <div>
                                <div className="font-bold text-gray-900 text-xs">
                                  {ch.student?.name}
                                  <span className="text-gray-400 text-[11px] font-normal ml-2 font-mono">
                                    Roll: {ch.rollNumber || '—'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {ch.challanNumber} • {ch.monthName}
                                  {ch.student?.father?.name && ` • Father: ${ch.student.father.name}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-red-600">
                                  PKR {ch.balanceAmount.toLocaleString()}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectChallanForCollection(ch)}
                                  className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                                >
                                  Collect Fee
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {finderClass && !loadingClassChallans && finderClassChallans.length === 0 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800">
                          No pending dues found in this class for active session!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode C: By Voucher / Challan ID */}
                  {findMode === 'voucher' && (
                    <form onSubmit={handleSearchChallan} className="flex gap-2">
                      <input
                        type="text"
                        value={challanQuery}
                        onChange={(e) => setChallanQuery(e.target.value)}
                        placeholder="Enter Challan # (e.g. CH-2026-04-0001) or Student ID"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                      />
                      <button
                        type="submit"
                        disabled={searchingChallan || !challanQuery.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                      >
                        {searchingChallan ? 'Searching...' : 'Search'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {collectError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{collectError}</span>
                </div>
              )}

              {/* Selected Challan Details Card */}
              {selectedChallan && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                    <div>
                      <span className="text-xs text-indigo-600 font-mono font-bold">{selectedChallan.challanNumber}</span>
                      <span className="text-xs text-gray-500 ml-2">({selectedChallan.monthName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Balance: PKR {selectedChallan.balanceAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedChallan(null)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Student Name:</span>
                      <span className="font-semibold text-gray-900">{selectedChallan.student?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Student ID / Roll:</span>
                      <span className="font-mono text-gray-700">
                        {selectedChallan.student?.studentId} {selectedChallan.rollNumber ? `• Roll ${selectedChallan.rollNumber}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Class / Section:</span>
                      <span className="font-medium text-gray-900">
                        {selectedChallan.class?.name || '—'} {selectedChallan.section?.name ? `(${selectedChallan.section.name})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Total Invoiced:</span>
                      <span className="text-gray-900 font-semibold">PKR {selectedChallan.totalPayable.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Already Paid:</span>
                      <span className="text-emerald-600 font-semibold">PKR {selectedChallan.paidAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Due Date:</span>
                      <span className="text-gray-700 font-medium">
                        {new Date(selectedChallan.dueDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Collection Fields */}
              {selectedChallan && (
                <form onSubmit={handleRecordPayment} className="space-y-4 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Payment Amount (PKR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedChallan.balanceAmount}
                        step="1"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-base font-bold text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>Max Balance: PKR {selectedChallan.balanceAmount.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => setCollectAmount(String(selectedChallan.balanceAmount))}
                          className="text-indigo-600 hover:text-indigo-700 font-medium underline"
                        >
                          Pay Full Balance
                        </button>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Payment Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={collectMethod}
                        onChange={(e) => setCollectMethod(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="cash">Cash (Counter Collection)</option>
                        <option value="bank_transfer">Bank Deposit / Online Transfer</option>
                        <option value="easypaisa">Easypaisa</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Method Details */}
                  {collectMethod !== 'cash' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Bank / Wallet Name</label>
                        <input
                          type="text"
                          value={collectBankName}
                          onChange={(e) => setCollectBankName(e.target.value)}
                          placeholder="e.g. Meezan Bank, HBL, Easypaisa"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Transaction ID / Cheque #</label>
                        <input
                          type="text"
                          value={collectTxnId}
                          onChange={(e) => setCollectTxnId(e.target.value)}
                          placeholder="e.g. TXN-892183 or Cheque No."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remarks / Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cashier Notes / Remarks
                    </label>
                    <input
                      type="text"
                      value={collectNotes}
                      onChange={(e) => setCollectNotes(e.target.value)}
                      placeholder="Optional receipt notes or depositor remarks..."
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex justify-end gap-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCollectModal(false);
                        resetCollectForm();
                      }}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs"
                    >
                      {actionLoading ? 'Recording Payment...' : `Record Payment (PKR ${parseFloat(collectAmount || 0).toLocaleString()})`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE PAYMENT RECEIPT MODAL */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between no-print bg-gray-50/50">
              <div className="flex items-center gap-2 text-indigo-600">
                <Receipt className="w-5 h-5" />
                <span className="font-bold text-gray-900 text-base">Official Payment Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedReceipt(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 text-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Slip Card */}
            <div id="printable-receipt-area" className="p-6 bg-white text-gray-900 m-4 rounded-xl border border-gray-200">
              {/* School Header */}
              <div className="text-center border-b-2 border-gray-900 pb-3 mb-4">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-gray-900">
                  BSO Model High School
                </h2>
                <p className="text-xs text-gray-600 font-medium">
                  Main Campus, Sector 11-A, North Karachi • Contact: (021) 3698-1122
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded">
                  Official Fee Payment Receipt
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-4 pb-3 border-b border-gray-200">
                <div>
                  <span className="text-gray-500">Receipt No:</span>{' '}
                  <span className="font-bold font-mono text-gray-900">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Payment Date:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedReceipt.paymentDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Challan Reference:</span>{' '}
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedReceipt.challan?.challanNumber}
                  </span>{' '}
                  ({selectedReceipt.challan?.monthName})
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Payment Method:</span>{' '}
                  <span className="font-semibold uppercase text-gray-900">
                    {getMethodLabel(selectedReceipt.paymentMethod)}
                    {selectedReceipt.transactionId ? ` (Txn: ${selectedReceipt.transactionId})` : ''}
                  </span>
                </div>
              </div>

              {/* Student Profile Block */}
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs mb-4 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Student Name:</span>{' '}
                  <span className="font-bold text-gray-900">{selectedReceipt.student?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Father Name:</span>{' '}
                  <span className="font-semibold text-gray-800">{selectedReceipt.student?.father?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Student ID / ADM:</span>{' '}
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedReceipt.student?.studentId} {selectedReceipt.student?.admissionNumber ? `(${selectedReceipt.student.admissionNumber})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Class & Section:</span>{' '}
                  <span className="font-semibold text-gray-800">{selectedReceipt.class?.name}</span>
                </div>
              </div>

              {/* Financial Transaction Table */}
              <table className="w-full text-xs border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700">
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-3 text-gray-700">
                      Total Invoiced Fee for {selectedReceipt.challan?.monthName || 'Billing Period'}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-900">
                      {(selectedReceipt.challan?.totalPayable || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-900">
                    <td className="py-2.5 px-3">
                      Amount Received (Current Payment)
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-extrabold text-emerald-700">
                      PKR {selectedReceipt.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="text-gray-700">
                    <td className="py-2 px-3">
                      Remaining Outstanding Balance on Challan
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900">
                      PKR {(selectedReceipt.challan?.balanceAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Notes */}
              {selectedReceipt.notes && (
                <p className="text-[11px] text-gray-500 italic mb-4">
                  Note: {selectedReceipt.notes}
                </p>
              )}

              {/* Signatures Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-500 block">Received By:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedReceipt.receivedBy?.name || 'Accountant / Cashier'}
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    (Authorized Cashier Signature)
                  </span>
                </div>
                <div className="text-right">
                  <div className="inline-block border border-dashed border-gray-400 px-6 py-4 rounded text-center text-[11px] text-gray-500">
                    Official School Stamp
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 mt-4 border-t border-gray-100 pt-2">
                This is a computer-generated official receipt issued by BSO School Management System.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVERSAL CONFIRMATION MODAL */}
      {showReverseModal && paymentToReverse && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reverse Payment</h3>
                <p className="text-xs text-gray-500">Restore challan balance and audit transaction</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-mono font-bold text-indigo-600">{paymentToReverse.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-semibold text-gray-900">{paymentToReverse.student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reversible Amount:</span>
                <span className="font-bold text-rose-600">PKR {paymentToReverse.amount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              Warning: Reversing this payment will restore PKR {paymentToReverse.amount.toLocaleString()} back to the student's Challan balance.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mandatory Reason for Reversal <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="2"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Cheque bounced, duplicate entry entered by mistake, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowReverseModal(false);
                  setPaymentToReverse(null);
                  setReversalReason('');
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !reversalReason.trim()}
                onClick={handleReversePayment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
              >
                {actionLoading ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
