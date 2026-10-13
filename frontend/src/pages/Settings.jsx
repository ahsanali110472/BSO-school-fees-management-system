import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  History,
  Lock,
  Building,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Terminal,
  Server,
  Layers,
  Clock,
  User,
  X,
  Plus,
  Check,
  GraduationCap
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'audit' | 'security' | 'profile'

  // Academic Sessions Management
  const [sessionsList, setSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStart, setNewSessionStart] = useState('');
  const [newSessionEnd, setNewSessionEnd] = useState('');
  const [newSessionCurrent, setNewSessionCurrent] = useState(false);
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [submittingSession, setSubmittingSession] = useState(false);

  // Audit Logs Data & Filters
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (search) params.append('search', search);
      if (moduleFilter && moduleFilter !== 'all') params.append('module', moduleFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [logsRes, summaryRes] = await Promise.all([
        api.get(`/audit-logs?${params.toString()}`),
        api.get('/audit-logs/summary').catch(() => ({ data: null })),
      ]);

      const logData = logsRes?.data?.data || logsRes?.data;
      if (logData) {
        setLogs(logData.logs || []);
        setTotalPages(logData.pagination?.totalPages || 1);
        setTotalRecords(logData.pagination?.total || 0);
      }

      const sumData = summaryRes?.data?.data || summaryRes?.data;
      if (sumData) {
        setSummary(sumData);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err?.response?.data?.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, statusFilter, startDate, endDate]);

  // Fetch Sessions
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/sessions');
      const list = res?.data?.sessions || res?.data?.data?.sessions || [];
      setSessionsList(list);
    } catch (err) {
      setSessionError(err?.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim() || !newSessionStart || !newSessionEnd) {
      setSessionError('Please fill in session name, start date, and end date.');
      return;
    }
    setSubmittingSession(true);
    setSessionError('');
    try {
      await api.post('/sessions', {
        name: newSessionName.trim(),
        startDate: newSessionStart,
        endDate: newSessionEnd,
        isCurrent: newSessionCurrent,
        description: newSessionDesc.trim() || undefined,
      });
      setSessionSuccess(`Academic Session "${newSessionName}" created successfully!`);
      setShowNewSessionModal(false);
      setNewSessionName('');
      setNewSessionStart('');
      setNewSessionEnd('');
      setNewSessionCurrent(false);
      setNewSessionDesc('');
      fetchSessions();
    } catch (err) {
      setSessionError(err?.response?.data?.message || 'Failed to create academic session');
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleSetCurrentSession = async (session) => {
    try {
      await api.patch(`/sessions/${session._id}/current`);
      setSessionSuccess(`"${session.name}" is now marked as the active academic session!`);
      fetchSessions();
    } catch (err) {
      setSessionError(err?.response?.data?.message || 'Failed to activate session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            System Settings & Academic Sessions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage academic session calendars, review security audit trails, and inspect system defenses.
          </p>
        </div>

        {activeTab === 'audit' && (
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        )}

        {activeTab === 'sessions' && (
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create New Academic Session
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-2">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Academic Sessions
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Logs Explorer
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security Defenses & Policies
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building className="w-4 h-4" />
          Institution Profile
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Session Alerts */}
      {sessionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sessionSuccess}</span>
          </div>
          <button onClick={() => setSessionSuccess('')} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ×
          </button>
        </div>
      )}

      {sessionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{sessionError}</span>
          </div>
          <button onClick={() => setSessionError('')} className="text-rose-500 hover:text-rose-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 0. ACADEMIC SESSIONS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Informational Guidance Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Academic Session (School Year)</h3>
                <p className="text-xs text-indigo-950 mt-1 max-w-2xl leading-relaxed">
                  The Academic Session is the master calendar cycle (e.g. <strong>2026-27</strong>) governing student enrollments, fee structures, promotions, and monthly fee challans. Exactly one session is marked as <strong>Current Active Session</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewSessionModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create New Session
            </button>
          </div>

          {/* Sessions Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 font-semibold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Session Name</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">End Date</th>
                    <th className="py-3.5 px-4 text-center">Current Active</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {loadingSessions ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Loading academic sessions...
                      </td>
                    </tr>
                  ) : sessionsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        <GraduationCap className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-700">No Academic Sessions Found</p>
                        <p className="text-xs text-gray-500 mt-1">Create your first academic session using the button above.</p>
                      </td>
                    </tr>
                  ) : (
                    sessionsList.map((ses) => (
                      <tr key={ses._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900 text-sm">
                          {ses.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(ses.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(ses.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ses.isCurrent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                              <Check className="w-3.5 h-3.5" />
                              Active Session
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            ses.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {ses.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {ses.description || 'Academic Year Cycle'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!ses.isCurrent && (
                            <button
                              onClick={() => handleSetCurrentSession(ses)}
                              className="px-3 py-1 bg-white border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 rounded-lg text-xs font-semibold shadow-2xs transition"
                            >
                              Set as Active
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SESSION MODAL */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">Create Academic Session</h3>
              </div>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Session Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-27 or 2027-28"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newSessionStart}
                    onChange={(e) => setNewSessionStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newSessionEnd}
                    onChange={(e) => setNewSessionEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Academic cycle starting April"
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setCurrentSess"
                  checked={newSessionCurrent}
                  onChange={(e) => setNewSessionCurrent(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor="setCurrentSess" className="text-gray-700 cursor-pointer font-medium">
                  Set as Current Active Academic Session
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {submittingSession ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. AUDIT LOGS EXPLORER */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase text-gray-400">Total Audit Events</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.totalLogs !== undefined ? summary.totalLogs : totalRecords}
              </div>
              <div className="text-xs text-indigo-600 font-medium mt-1">Immutable security ledger</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase text-gray-400">Security Exceptions</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {summary?.recentFailures || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Failed logins or blocked events</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase text-gray-400">Tracked Modules</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {summary?.moduleDistribution?.length || 10}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Full-stack audit coverage</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Search Events</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by action, user, or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                </div>
              </div>

              {/* Module Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">All Modules</option>
                  <option value="AUTH">Authentication</option>
                  <option value="PAYMENTS">Fee Payments</option>
                  <option value="FEES">Fee Structures / Challans</option>
                  <option value="STUDENTS">Students</option>
                  <option value="USERS">Staff Accounts</option>
                  <option value="PROMOTIONS">Promotions</option>
                  <option value="SETTINGS">Settings & Security</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILURE">Failure</option>
                  <option value="WARNING">Warning</option>
                </select>
              </div>

              {/* Clear */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setModuleFilter('');
                    setStatusFilter('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="w-full text-xs py-1.5 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading audit trail records...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-400">
                        No audit events match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{log.userName}</div>
                          <div className="text-[10px] text-gray-400 capitalize">{log.userRole}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-gray-700" title={log.description}>
                          {log.description}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                          {log.ipAddress}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.status === 'WARNING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Inspect Change Diff"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Showing page {page} of {totalPages} ({totalRecords} records)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-gray-300 bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-gray-300 bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECURITY DEFENSES & POLICIES */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Active System Security Controls</h3>
            <p className="text-xs text-gray-500 mb-6">
              Verified security enforcement adhering to Master Prompt Sections 35 & 36.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Defense 1: Rate Limiting */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">API Rate Limiting</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Enforces 500 requests / 15 mins for global endpoints and strict 15 attempts / 15 mins for login to prevent brute force.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (express-rate-limit)
                  </span>
                </div>
              </div>

              {/* Defense 2: NoSQL Injection Protection */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">NoSQL Query Sanitization</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Strips MongoDB operator characters ($gt, $where, etc.) from request bodies, parameters, and query strings.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (sanitizeQueryInputs)
                  </span>
                </div>
              </div>

              {/* Defense 3: Password Hashing */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Bcrypt Password Hashing</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Plaintext passwords are never stored or logged. Salted and hashed with 10 rounds of bcrypt.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (bcryptjs)
                  </span>
                </div>
              </div>

              {/* Defense 4: Security Headers */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Helmet Security Headers</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    HTTP headers configured for XSS filtering, clickjacking protection (frameguard), and MIME-type sniffing defense.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (helmet 8.x)
                  </span>
                </div>
              </div>

              {/* Defense 5: Role-Based Authorization */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Role-Based Access Control (RBAC)</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Strict segregation of Super Admin, School Admin, and Accountant permissions across frontend routes and API endpoints.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (protect + authorize)
                  </span>
                </div>
              </div>

              {/* Defense 6: Audit Trail Logging */}
              <div className="p-4 border border-gray-200 rounded-xl flex items-start gap-3 bg-gray-50/50">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Immutable Audit Trails</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Logs all authentications, financial collections, reversals, and student changes with IP, actor, and sanitized diffs.
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active (AuditService)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INSTITUTION PROFILE */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs max-w-3xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Institution Information</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Official school profile printed on fee challans, receipts, and academic transcripts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-semibold uppercase">School Name</span>
              <div className="font-bold text-gray-900 text-sm mt-0.5">
                BSO Model High School & College
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase">Affiliation</span>
              <div className="font-medium text-gray-800 mt-0.5">
                Board of Secondary Education Karachi (BSEK)
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase">Campus Address</span>
              <div className="font-medium text-gray-800 mt-0.5">
                Plot ST-4, Sector 5-C/4, North Karachi, Karachi, Pakistan
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase">Contact Information</span>
              <div className="font-medium text-gray-800 mt-0.5">
                Tel: 021-36900000 • Email: info@bso.edu.pk
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase">Partner Bank 1</span>
              <div className="font-medium text-gray-800 mt-0.5">
                Meezan Bank Ltd (A/C: 0101-0102030405)
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase">Partner Bank 2</span>
              <div className="font-medium text-gray-800 mt-0.5">
                Habib Bank Ltd (A/C: 2201-9988776655)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* AUDIT LOG CHANGE DIFF MODAL */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Audit Event Details — {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-gray-400">Module:</span>
                <div className="font-bold text-gray-900">{selectedLog.module}</div>
              </div>
              <div>
                <span className="text-gray-400">Actor:</span>
                <div className="font-bold text-gray-900">{selectedLog.userName}</div>
              </div>
              <div>
                <span className="text-gray-400">IP:</span>
                <div className="font-mono text-gray-800">{selectedLog.ipAddress}</div>
              </div>
              <div>
                <span className="text-gray-400">Timestamp:</span>
                <div className="text-gray-800 font-mono text-[10px]">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-700">
              <strong>Description:</strong> {selectedLog.description}
            </div>

            {/* Old vs New Data Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <h4 className="text-xs font-bold text-rose-700 uppercase mb-1">Previous State (Old Data)</h4>
                <pre className="p-3 bg-gray-900 text-rose-300 rounded-lg text-[11px] overflow-x-auto max-h-52 font-mono">
                  {selectedLog.oldData
                    ? JSON.stringify(selectedLog.oldData, null, 2)
                    : '// No prior state recorded'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-1">Applied State (New Data)</h4>
                <pre className="p-3 bg-gray-900 text-emerald-300 rounded-lg text-[11px] overflow-x-auto max-h-52 font-mono">
                  {selectedLog.newData
                    ? JSON.stringify(selectedLog.newData, null, 2)
                    : '// No new state delta recorded'}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
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
