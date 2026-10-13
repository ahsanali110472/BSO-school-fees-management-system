import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileText,
  Layers,
  CreditCard,
  ChevronDown,
  Calendar,
  Building,
  GraduationCap,
  CheckCircle2,
  Clock,
  User,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();

  // Active Report Tab: 'collections' | 'outstanding' | 'ledger' | 'classes' | 'methods'
  const [activeTab, setActiveTab] = useState('collections');

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [minOverdueDays, setMinOverdueDays] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown reference lists
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Report Data States
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Student Ledger specific states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);

  // Fetch dropdown filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [sessRes, classRes] = await Promise.all([
          api.get('/sessions').catch(() => ({ data: [] })),
          api.get('/classes').catch(() => ({ data: [] })),
        ]);

        const rawSessions = sessRes?.data?.data || sessRes?.data?.sessions || sessRes?.data || [];
        const rawClasses = classRes?.data?.data || classRes?.data?.classes || classRes?.data || [];

        setSessions(Array.isArray(rawSessions) ? rawSessions : []);
        setClasses(Array.isArray(rawClasses) ? rawClasses : []);

        const activeSess = (Array.isArray(rawSessions) ? rawSessions : []).find((s) => s.isCurrent || s.status === 'active');
        if (activeSess) setSelectedSession(activeSess._id);
      } catch (err) {
        console.error('Failed to load filter dropdowns:', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection('');
      return;
    }
    const fetchSections = async () => {
      try {
        const res = await api.get(`/sections?classId=${selectedClass}`);
        const rawSections = res?.data?.data || res?.data?.sections || res?.data || [];
        setSections(Array.isArray(rawSections) ? rawSections : []);
      } catch (err) {
        console.error('Failed to load sections:', err);
      }
    };
    fetchSections();
  }, [selectedClass]);

  // Main Report Fetcher
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedSession) params.append('sessionId', selectedSession);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);

      if (activeTab === 'collections') {
        endpoint = '/reports/collections';
        if (paymentMethod) params.append('paymentMethod', paymentMethod);
      } else if (activeTab === 'outstanding') {
        endpoint = '/reports/outstanding';
        if (minOverdueDays) params.append('minOverdueDays', minOverdueDays);
        if (searchQuery) params.append('search', searchQuery);
      } else if (activeTab === 'classes') {
        endpoint = '/reports/class-summary';
      } else if (activeTab === 'methods') {
        endpoint = '/reports/payment-methods';
      }

      if (endpoint) {
        const res = await api.get(`${endpoint}?${params.toString()}`);
        const data = res?.data?.data || res?.data;
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err?.response?.data?.message || 'Failed to load report data');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    startDate,
    endDate,
    selectedSession,
    selectedClass,
    selectedSection,
    paymentMethod,
    minOverdueDays,
    searchQuery,
  ]);

  // Refetch when tab or filters change
  useEffect(() => {
    if (activeTab !== 'ledger') {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  // Student search for ledger
  const handleSearchStudents = async (query) => {
    setStudentSearch(query);
    if (!query || query.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(query)}&limit=8`);
      const rawStudents = res?.data?.data?.students || res?.data?.students || [];
      setStudentSearchResults(Array.isArray(rawStudents) ? rawStudents : []);
    } catch (err) {
      console.error('Search students failed:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Load ledger for selected student
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentSearchResults([]);
    setStudentSearch('');
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/student-ledger/${student._id}`);
      const data = res?.data?.data || res?.data;
      setLedgerData(data);
    } catch (err) {
      console.error('Failed to load student ledger:', err);
      setError('Failed to load student ledger');
    } finally {
      setLoading(false);
    }
  };

  // Export Excel (.xlsx) handler
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let exportUrl = '';
      let defaultFilename = 'Report.xlsx';
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedSession) params.append('sessionId', selectedSession);
      if (selectedClass) params.append('classId', selectedClass);

      if (activeTab === 'collections') {
        if (paymentMethod) params.append('paymentMethod', paymentMethod);
        exportUrl = `/reports/collections/export-excel?${params.toString()}`;
        defaultFilename = `Collections_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 'outstanding') {
        if (minOverdueDays) params.append('minOverdueDays', minOverdueDays);
        if (searchQuery) params.append('search', searchQuery);
        exportUrl = `/reports/outstanding/export-excel?${params.toString()}`;
        defaultFilename = `Defaulters_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 'classes') {
        exportUrl = `/reports/class-summary/export-excel?${params.toString()}`;
        defaultFilename = `Class_Revenue_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 'ledger' && selectedStudent) {
        exportUrl = `/reports/student-ledger/${selectedStudent._id}/export-excel`;
        defaultFilename = `Ledger_${selectedStudent.admissionNumber || 'Student'}.xlsx`;
      }

      if (!exportUrl) {
        setError('Please select a valid report or student to export.');
        setExporting(false);
        return;
      }

      const response = await api.get(exportUrl, { responseType: 'blob' });
      const blob = new Blob([response.data || response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel export error:', err);
      setError('Failed to download Excel file');
    } finally {
      setExporting(false);
    }
  };

  // Quick date filters
  const setQuickDate = (type) => {
    const today = new Date();
    if (type === 'today') {
      const d = today.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (type === 'clear') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Style Definition */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Financial & Academic Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate collections, track fee defaulters, inspect student ledgers, and export genuine Excel reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting || (activeTab === 'ledger' && !selectedStudent)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 overflow-x-auto no-print">
        {[
          { id: 'collections', label: 'Collections & Receipts', icon: Receipt },
          { id: 'outstanding', label: 'Defaulters & Outstanding', icon: AlertTriangle },
          { id: 'ledger', label: 'Student Fee Ledger', icon: FileText },
          { id: 'classes', label: 'Class Revenue Summary', icon: Layers },
          { id: 'methods', label: 'Payment Channels', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar (Applicable per tab) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filters & Parameters
          </span>

          {/* Quick Date Shortcuts for Collections and Channels */}
          {(activeTab === 'collections' || activeTab === 'methods') && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Quick:</span>
              <button
                onClick={() => setQuickDate('today')}
                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setQuickDate('month')}
                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              >
                This Month
              </button>
              <button
                onClick={() => setQuickDate('clear')}
                className="px-2 py-0.5 rounded text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Date Range Start */}
          {(activeTab === 'collections' || activeTab === 'methods') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Date Range End */}
          {(activeTab === 'collections' || activeTab === 'methods') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Academic Session */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.year})
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter (Collections, Outstanding) */}
          {(activeTab === 'collections' || activeTab === 'outstanding') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section Filter (Outstanding) */}
          {activeTab === 'outstanding' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:bg-gray-100 disabled:opacity-60"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method Filter */}
          {activeTab === 'collections' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          )}

          {/* Min Overdue Days (Outstanding) */}
          {activeTab === 'outstanding' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Overdue</label>
              <select
                value={minOverdueDays}
                onChange={(e) => setMinOverdueDays(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="">Any Overdue</option>
                <option value="7">Overdue &gt; 7 Days</option>
                <option value="15">Overdue &gt; 15 Days</option>
                <option value="30">Overdue &gt; 30 Days (Defaulter)</option>
                <option value="60">Overdue &gt; 60 Days (Critical)</option>
              </select>
            </div>
          )}

          {/* Search Query Filter (Outstanding) */}
          {activeTab === 'outstanding' && (
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search Student / Challan</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Admission #, name, challan #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRINTABLE REPORT CONTAINER (USED BOTH FOR ON-SCREEN & PRINT) */}
      {/* ======================================================== */}
      <div id="printable-report-area" className="space-y-6 bg-white">
        {/* Printable Official School Header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
            BSO MODEL HIGH SCHOOL & COLLEGE
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Main Campus, North Karachi • Tel: 021-36900000 • Email: info@bso.edu.pk
          </p>
          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-700">
            <span className="font-bold">
              REPORT: {activeTab === 'collections' && 'Fee Collections & Receipts'}
              {activeTab === 'outstanding' && 'Fee Defaulters & Outstanding Balances'}
              {activeTab === 'ledger' && `Student Financial Fee Ledger — ${selectedStudent?.name || ''}`}
              {activeTab === 'classes' && 'Class Revenue & Fee Recovery Summary'}
              {activeTab === 'methods' && 'Payment Gateway & Channel Breakdown'}
            </span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: COLLECTIONS REPORT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'collections' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Collected</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  PKR {Number(reportData?.summary?.totalCollected || 0).toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Verified Receipts</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Payment Transactions</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData?.summary?.totalRecords || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">In selected range</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Top Payment Mode</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2 capitalize">
                  {reportData?.summary?.methodSummary
                    ? Object.keys(reportData.summary.methodSummary)[0]?.replace('_', ' ') || 'Cash'
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Primary Collection Channel</div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Receipt #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Fee Month</th>
                      <th className="px-4 py-3">Challan #</th>
                      <th className="px-4 py-3 text-right">Amount (PKR)</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center py-10 text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          Loading collections data...
                        </td>
                      </tr>
                    ) : !reportData?.rows || reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-10 text-gray-400">
                          No collection records found for the selected parameters.
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-indigo-600">{row.receiptNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.paymentDate}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{row.studentName}</div>
                            <div className="text-[10px] text-gray-400">{row.admissionNumber}</div>
                          </td>
                          <td className="px-4 py-3">{row.className}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{row.feeMonth}</td>
                          <td className="px-4 py-3 text-gray-500">{row.invoice}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {Number(row.amount).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {row.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{row.receivedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData?.rows && reportData.rows.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                      <tr>
                        <td colSpan="6" className="px-4 py-3 uppercase tracking-wider text-right">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700 text-sm">
                          PKR {Number(reportData.summary.totalCollected).toLocaleString()}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: OUTSTANDING FEES & DEFAULTERS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'outstanding' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Outstanding</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2">
                  PKR {Number(reportData?.summary?.totalOutstanding || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Pending Unpaid Fees</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Defaulter Invoices</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData?.summary?.totalRecords || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unsettled Challans</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Invoiced</span>
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  PKR {Number(reportData?.summary?.totalPayable || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Original Billed Amount</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Recovery Rate</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  {reportData?.summary?.totalPayable > 0
                    ? `${(
                        ((reportData.summary.totalPaid || 0) / reportData.summary.totalPayable) *
                        100
                      ).toFixed(1)}%`
                    : '0%'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Paid vs Invoiced</div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Challan #</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Father Name</th>
                      <th className="px-4 py-3">Class & Section</th>
                      <th className="px-4 py-3">Fee Month</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3 text-center">Overdue</th>
                      <th className="px-4 py-3 text-right">Payable</th>
                      <th className="px-4 py-3 text-right">Balance Due</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-10 text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          Loading outstanding fee records...
                        </td>
                      </tr>
                    ) : !reportData?.rows || reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-10 text-emerald-600 font-medium">
                          No outstanding fees or defaulters match the selected criteria!
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.challanNumber}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{row.studentName}</div>
                            <div className="text-[10px] text-gray-400">{row.admissionNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{row.fatherName}</td>
                          <td className="px-4 py-3">
                            {row.className} - {row.sectionName}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-700">{row.feeMonth}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.dueDate}</td>
                          <td className="px-4 py-3 text-center">
                            {row.daysOverdue > 0 ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.daysOverdue > 30
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {row.daysOverdue} days
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">Within due</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {Number(row.totalPayable).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600">
                            PKR {Number(row.balanceAmount).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData?.rows && reportData.rows.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                      <tr>
                        <td colSpan="7" className="px-4 py-3 uppercase tracking-wider text-right">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          PKR {Number(reportData.summary.totalPayable).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600 text-sm">
                          PKR {Number(reportData.summary.totalOutstanding).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: STUDENT FEE LEDGER */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Student Search Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs no-print">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Select Student for Financial Ledger
              </label>
              <div className="relative max-w-xl">
                <input
                  type="text"
                  placeholder="Search by student name or admission number (e.g. ADM-2026-0001)..."
                  value={studentSearch}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                {searchingStudents && (
                  <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-2.5" />
                )}

                {/* Dropdown search results */}
                {studentSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {studentSearchResults.map((st) => (
                      <button
                        key={st._id}
                        type="button"
                        onClick={() => handleSelectStudent(st)}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">{st.name}</div>
                          <div className="text-gray-500">
                            Adm: <span className="font-mono">{st.admissionNumber}</span> • Father:{' '}
                            {st.father?.name || 'N/A'}
                          </div>
                        </div>
                        <span className="text-indigo-600 font-medium">Select &rarr;</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Student Banner & KPIs */}
            {ledgerData ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      {ledgerData.student?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{ledgerData.student?.fullName}</h3>
                      <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                        <span>
                          Admission #: <strong className="font-mono">{ledgerData.student?.admissionNumber}</strong>
                        </span>
                        <span>
                          Father: <strong>{ledgerData.student?.fatherName}</strong>
                        </span>
                        <span>
                          Class: <strong>{ledgerData.student?.className} - {ledgerData.student?.sectionName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Current Balance</div>
                      <div
                        className={`text-xl font-bold ${
                          ledgerData.summary?.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        PKR {Number(ledgerData.summary?.currentBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ledgerData.summary?.status === 'CLEARED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ledgerData.summary?.status}
                    </span>
                  </div>
                </div>

                {/* Ledger Entries Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-center">Type</th>
                          <th className="px-4 py-3">Reference #</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Debit (Invoiced)</th>
                          <th className="px-4 py-3 text-right">Credit (Paid)</th>
                          <th className="px-4 py-3 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {!ledgerData.ledger || ledgerData.ledger.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-gray-400">
                              No financial entries recorded for this student.
                            </td>
                          </tr>
                        ) : (
                          ledgerData.ledger.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">{entry.date}</td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    entry.type === 'INVOICE'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {entry.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-medium text-gray-900">
                                {entry.reference}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{entry.description}</td>
                              <td className="px-4 py-3 text-right font-medium text-amber-700">
                                {entry.debit > 0 ? Number(entry.debit).toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-emerald-700">
                                {entry.credit > 0 ? Number(entry.credit).toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                PKR {Number(entry.balance).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {ledgerData.ledger && ledgerData.ledger.length > 0 && (
                        <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                          <tr>
                            <td colSpan="4" className="px-4 py-3 uppercase tracking-wider text-right">
                              Total Summary:
                            </td>
                            <td className="px-4 py-3 text-right text-amber-700">
                              PKR {Number(ledgerData.summary?.totalBilled || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-700">
                              PKR {Number(ledgerData.summary?.totalPaid || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              PKR {Number(ledgerData.summary?.currentBalance || 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-xl py-12 text-center text-gray-400 no-print">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-medium text-gray-600">No Student Selected</p>
                <p className="text-xs text-gray-400 mt-1">
                  Type an admission number or name in the box above to generate their chronological ledger.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: CLASS REVENUE SUMMARY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Billed</span>
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  PKR {Number(reportData?.summary?.totalBilled || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Across all classes</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Collected</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  PKR {Number(reportData?.summary?.totalPaid || 0).toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1">Realized Revenue</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Outstanding</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2">
                  PKR {Number(reportData?.summary?.totalBalance || 0).toLocaleString()}
                </div>
                <div className="text-xs text-rose-600 font-medium mt-1">Unpaid Balance</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Overall Recovery</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600 mt-2">
                  {reportData?.summary?.overallCollectionRate || '0.0%'}
                </div>
                <div className="text-xs text-indigo-600 font-medium mt-1">Collection Efficiency</div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Class Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3 text-center">Challans Issued</th>
                      <th className="px-4 py-3 text-right">Invoiced (PKR)</th>
                      <th className="px-4 py-3 text-right">Collected (PKR)</th>
                      <th className="px-4 py-3 text-right">Balance Due (PKR)</th>
                      <th className="px-4 py-3 text-center">Recovery %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          Loading class summaries...
                        </td>
                      </tr>
                    ) : !reportData?.rows || reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-400">
                          No class revenue records found.
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((cls, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900">{cls.className}</td>
                          <td className="px-4 py-3 font-mono text-gray-500">{cls.code}</td>
                          <td className="px-4 py-3 text-center font-medium text-gray-700">
                            {cls.challanCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {Number(cls.totalBilled).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                            {Number(cls.totalPaid).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-rose-600">
                            {Number(cls.totalBalance).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                parseFloat(cls.collectionRate) >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : parseFloat(cls.collectionRate) >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {cls.collectionRate}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData?.rows && reportData.rows.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 uppercase tracking-wider text-right">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          PKR {Number(reportData.summary.totalBilled).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          PKR {Number(reportData.summary.totalPaid).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600">
                          PKR {Number(reportData.summary.totalBalance).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-indigo-700">
                          {reportData.summary.overallCollectionRate}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: PAYMENT METHODS & CHANNELS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'methods' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Transactions</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {reportData?.summary?.totalTransactions || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Processed Receipts</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Total Volume</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  PKR {Number(reportData?.summary?.grandTotal || 0).toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1">All Channels Combined</div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Payment Channel</th>
                      <th className="px-4 py-3 text-center">Transactions</th>
                      <th className="px-4 py-3 text-right">Volume (PKR)</th>
                      <th className="px-4 py-3 text-center">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          Loading payment channels data...
                        </td>
                      </tr>
                    ) : !reportData?.rows || reportData.rows.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-gray-400">
                          No payment transactions recorded for selected date range.
                        </td>
                      </tr>
                    ) : (
                      reportData.rows.map((method, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            {method.method}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-gray-700">
                            {method.transactionCount}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            PKR {Number(method.totalAmount).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {method.percentage}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData?.rows && reportData.rows.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                      <tr>
                        <td className="px-4 py-3 uppercase tracking-wider">Total:</td>
                        <td className="px-4 py-3 text-center">{reportData.summary.totalTransactions}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          PKR {Number(reportData.summary.grandTotal).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">100.0%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Printable Footer (Section 31) */}
        <div className="hidden print:block pt-8 mt-8 border-t border-slate-300 text-xs text-slate-500">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-semibold text-slate-800">Generated by: {user?.name || 'Administrator'}</p>
              <p>BSO Model High School & College ERP • System Generated Official Document</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-700 pb-1 mb-1"></div>
              <p className="font-medium text-slate-800">Authorized Accountant Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
