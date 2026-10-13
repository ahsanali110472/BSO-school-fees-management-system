import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  GraduationCap,
  Users,
  Building,
  Layers,
  DollarSign,
  AlertTriangle,
  Receipt,
  TrendingUp,
  CreditCard,
  UserPlus,
  FileSpreadsheet,
  PlusCircle,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Activity,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role || 'super_admin';

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      const data = res?.data?.data || res?.data;
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err?.response?.data?.message || 'Unable to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const counts = stats?.counts || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSections: 0,
  };

  const financials = stats?.financials || {
    todayCollection: 0,
    monthCollection: 0,
    totalOutstanding: 0,
    pendingInvoicesCount: 0,
    totalInvoiced: 0,
  };

  const recentPayments = stats?.recentPayments || [];
  const recentAdmissions = stats?.recentAdmissions || [];
  const paymentMethods = stats?.paymentMethods || [];
  const classDistribution = stats?.classDistribution || [];
  const monthlyTrends = stats?.monthlyTrends || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            BSO Model High School Management System • Academic Session {stats?.activeSession || '2026-27'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SUPER ADMIN DASHBOARD */}
      {/* ======================================================== */}
      {role === 'super_admin' && (
        <div className="space-y-6">
          {/* Top KPI Cards (8 Core Metrics per Section 32) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Total Students</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalStudents}</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Active enrollments</div>
            </div>

            {/* Total Teachers */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Total Teachers</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalTeachers}</div>
              <div className="text-xs text-indigo-600 font-medium mt-1">Faculty members</div>
            </div>

            {/* Total Classes & Sections */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Classes / Sections</span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {counts.totalClasses} <span className="text-sm font-normal text-gray-400">/ {counts.totalSections}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Academic grade wings</div>
            </div>

            {/* Outstanding Fees */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Outstanding Fees</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-2">
                PKR {Number(financials.totalOutstanding).toLocaleString()}
              </div>
              <div className="text-xs text-rose-600 font-medium mt-1">
                {financials.pendingInvoicesCount} pending invoices
              </div>
            </div>

            {/* Today's Collection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Today's Collection</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                PKR {Number(financials.todayCollection).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{financials.todayCount || 0} receipts today</div>
            </div>

            {/* This Month's Collection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Month's Collection</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                PKR {Number(financials.monthCollection).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Current calendar month</div>
            </div>

            {/* Total Invoiced Volume */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Total Invoiced</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                PKR {Number(financials.totalInvoiced).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">All generated challans</div>
            </div>

            {/* Overall Recovery Rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Fee Recovery Rate</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mt-2">
                {financials.totalInvoiced > 0
                  ? `${(
                      ((financials.totalInvoiced - financials.totalOutstanding) / financials.totalInvoiced) *
                      100
                    ).toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Realized revenue ratio</div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-5 text-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">Quick Executive Shortcuts</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Frequently accessed operations for school administration and finance
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/students/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-medium text-white transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Admission
                </Link>
                <Link
                  to="/payments"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-xs font-medium text-emerald-200 transition"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Collect Fee
                </Link>
                <Link
                  to="/challans"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 rounded-lg text-xs font-medium text-indigo-200 transition"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Generate Challans
                </Link>
                <Link
                  to="/reports"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-medium text-white transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Reports Hub
                </Link>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Trend & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Trend Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Fee Collection History</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Monthly fee collection over the last 6 months</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Verified Inflows
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="mt-6 flex items-end justify-between gap-3 h-44 pt-6 border-b border-gray-200">
                {monthlyTrends.map((trend, idx) => {
                  const maxVal = Math.max(...monthlyTrends.map((t) => t.collected), 5000);
                  const heightPct = Math.max(8, Math.round((trend.collected / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        PKR {trend.collected.toLocaleString()}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                          trend.collected > 0
                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300'
                            : 'bg-gray-100'
                        }`}
                      ></div>
                      <span className="text-[10px] font-medium text-gray-500 mt-1">{trend.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Payment Channels</h3>
                <p className="text-xs text-gray-500 mt-0.5">Distribution across collection channels</p>

                <div className="mt-4 space-y-3">
                  {paymentMethods.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No payment transactions yet.</p>
                  ) : (
                    paymentMethods.map((m, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700">{m.method}</span>
                          <span className="font-mono text-gray-900 font-bold">
                            PKR {m.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${
                                financials.totalInvoiced > 0
                                  ? (m.totalAmount / (financials.totalInvoiced - financials.totalOutstanding || 1)) *
                                    100
                                  : 50
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                to="/reports"
                className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>View channel report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Payment Receipts</h3>
                <p className="text-xs text-gray-500 mt-0.5">Latest fee collections processed by cashiers</p>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all payments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Fee Month</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-400">
                        No recent payments recorded.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-indigo-600">{p.receiptNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.studentName}
                          <span className="text-[10px] text-gray-400 ml-1.5">({p.admissionNumber})</span>
                        </td>
                        <td className="px-4 py-3">{p.className}</td>
                        <td className="px-4 py-3 text-gray-700">{p.feeMonth}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          PKR {Number(p.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {p.paymentMethod}
                          </span>
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

      {/* ======================================================== */}
      {/* 2. SCHOOL ADMIN DASHBOARD */}
      {/* ======================================================== */}
      {role === 'school_admin' && (
        <div className="space-y-6">
          {/* Academic Entity Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Total Students</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalStudents}</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Enrolled students</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Active Faculty</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalTeachers}</div>
              <div className="text-xs text-indigo-600 font-medium mt-1">Teaching staff</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Classes Configured</span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalClasses}</div>
              <div className="text-xs text-gray-500 mt-1">Academic grade tiers</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Active Sections</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{counts.totalSections}</div>
              <div className="text-xs text-gray-500 mt-1">Classroom divisions</div>
            </div>
          </div>

          {/* Academic Shortcuts & Class Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class Enrollment Breakdown */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Student Strength by Class</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Enrollment distribution across active grades</p>
                </div>
                <Link to="/students" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Manage Students &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {classDistribution.length === 0 ? (
                  <p className="col-span-4 text-xs text-gray-400 py-6 text-center">No enrolled students found.</p>
                ) : (
                  classDistribution.map((c, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 truncate">{c.className}</div>
                      <div className="text-lg font-bold text-indigo-600 mt-1">{c.students}</div>
                      <div className="text-[10px] text-gray-400">Students</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Academic Operations</h3>
              <p className="text-xs text-gray-500">Fast access to core school tasks</p>

              <div className="space-y-2 pt-2">
                <Link
                  to="/students/register"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Student Admission
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/promotions"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Batch Promotion
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>

                <Link
                  to="/transfers"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Transfer Certificates
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Admissions Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Student Admissions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Newly enrolled students in the current academic session</p>
              </div>
              <Link
                to="/students"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all students</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Admission #</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Father Name</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3">Admission Date</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentAdmissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No recent student admissions found.
                      </td>
                    </tr>
                  ) : (
                    recentAdmissions.map((st, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-indigo-600 font-mono">
                          {st.admissionNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{st.name}</td>
                        <td className="px-4 py-3 text-gray-700">{st.fatherName}</td>
                        <td className="px-4 py-3">
                          {st.className} - {st.sectionName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{st.admissionDate}</td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            to={`/students/${st.id}`}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition"
                          >
                            View Profile
                          </Link>
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

      {/* ======================================================== */}
      {/* 3. ACCOUNTANT DASHBOARD */}
      {/* ======================================================== */}
      {role === 'accountant' && (
        <div className="space-y-6">
          {/* Accountant Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Today's Collections</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                PKR {Number(financials.todayCollection).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{financials.todayCount || 0} receipts processed</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Monthly Collection</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                PKR {Number(financials.monthCollection).toLocaleString()}
              </div>
              <div className="text-xs text-indigo-600 font-medium mt-1">This month realized</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Total Outstanding</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-2">
                PKR {Number(financials.totalOutstanding).toLocaleString()}
              </div>
              <div className="text-xs text-rose-600 font-medium mt-1">Total pending balances</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">Pending Challans</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">
                {financials.pendingInvoicesCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">Unpaid or partial</div>
            </div>
          </div>

          {/* Quick Cashier Action Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Fee Counter Controls</h3>
              <p className="text-xs text-gray-500">Fast fee entry, receipts, and challan lookups</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/payments"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-xs"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Collect Fee / Issue Receipt
              </Link>
              <Link
                to="/challans"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Challan Directory
              </Link>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Receipts Issued</h3>
                <p className="text-xs text-gray-500 mt-0.5">Payments recorded at the fee counter</p>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Full history</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Fee Month</th>
                    <th className="px-4 py-3 text-right">Amount (PKR)</th>
                    <th className="px-4 py-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No receipts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-indigo-600 font-mono">{p.receiptNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.studentName}
                          <span className="text-[10px] text-gray-400 ml-1.5">({p.admissionNumber})</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{p.feeMonth}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {Number(p.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {p.paymentMethod}
                          </span>
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
    </div>
  );
}
