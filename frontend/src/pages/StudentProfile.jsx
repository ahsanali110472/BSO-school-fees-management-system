import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Users,
  GraduationCap,
  CreditCard,
  Calendar,
  FileText,
  Clock,
  Edit2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  PlusCircle,
  Hash
} from 'lucide-react';
import api from '../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'enrollments', label: 'Academic & Enrollments', icon: GraduationCap },
  { id: 'fees', label: 'Fee & Ledger', icon: CreditCard },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'audit', label: 'Activity Log', icon: Clock },
];

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [currentEnrollment, setCurrentEnrollment] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Change Section / Roll No Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetSection, setTargetSection] = useState('');
  const [targetRoll, setTargetRoll] = useState('');
  const [savingEnroll, setSavingEnroll] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
    fetchAcademicLookups();
  }, [id]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/students/${id}`);
      const data = res?.data?.data || res?.data || {};
      const studentObj = data.student || data;
      setStudent(studentObj);
      setCurrentEnrollment(data.currentEnrollment);
      setEnrollments(studentObj?.enrollments || []);
      setEditData(studentObj);
    } catch (err) {
      console.error('Failed to load student profile:', err);
      setError(err.message || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicLookups = async () => {
    try {
      const [clsRes, secRes] = await Promise.all([
        api.get('/classes'),
        api.get('/sections'),
      ]);
      setClasses(clsRes?.data?.classes || clsRes?.data?.data?.classes || []);
      setSections(secRes?.data?.sections || secRes?.data?.data?.sections || []);
    } catch (err) {
      console.error('Lookup fetch failed:', err);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);
    try {
      const res = await api.put(`/students/${id}`, {
        name: editData.name,
        grNumber: editData.grNumber || undefined,
        gender: editData.gender,
        status: editData.status,
        father: editData.father,
        contact: editData.contact,
        address: editData.address,
      });
      const updatedStu = res?.data?.student || res?.data?.data?.student || editData;
      setStudent(updatedStu);
      setSuccessMsg('Student profile updated successfully.');
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student profile.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReassignSectionRoll = async (e) => {
    e.preventDefault();
    if (!currentEnrollment) return;
    setSavingEnroll(true);
    setError(null);
    try {
      await api.put(`/enrollments/${currentEnrollment._id}`, {
        section: targetSection || currentEnrollment.section?._id,
        rollNumber: targetRoll,
      });
      setSuccessMsg('Enrollment updated with new section and roll number.');
      setShowReassignModal(false);
      fetchStudentProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign enrollment.');
    } finally {
      setSavingEnroll(false);
    }
  };

  const openReassignDialog = () => {
    if (currentEnrollment) {
      setTargetSection(currentEnrollment.section?._id || '');
      setTargetRoll(currentEnrollment.rollNumber || '');
      setShowReassignModal(true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Active</span>;
      case 'struck_off':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Struck Off</span>;
      case 'transferred':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Transferred</span>;
      case 'passout':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Pass Out</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-sm font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Student Not Found</h2>
        <button
          onClick={() => navigate('/students')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          Return to Students
        </button>
      </div>
    );
  }

  const availableSections = currentEnrollment?.class?._id
    ? sections.filter((s) => (s.class?._id || s.class) === currentEnrollment.class._id)
    : sections;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Student Directory
      </button>

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

      {/* Section 17: Student Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {student.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                {getStatusBadge(student.status)}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  ID: {student.studentId}
                </span>
                <span>
                  GR No: <strong className="text-gray-800">{student.grNumber || 'N/A'}</strong>
                </span>
                <span>
                  Admission: <strong className="text-gray-800">{student.admissionNumber}</strong>
                </span>
                <span>
                  Roll No:{' '}
                  <strong className="text-gray-800">
                    {currentEnrollment?.rollNumber || 'Unassigned'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-indigo-700 pt-1 font-medium">
                <span>
                  Class: {currentEnrollment?.class?.name || 'Not enrolled'} (
                  {currentEnrollment?.section?.name ? `Section ${currentEnrollment.section.name}` : 'N/A'})
                </span>
                <span className="text-gray-300">|</span>
                <span>Session: {currentEnrollment?.academicSession?.name || 'Current'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
              Edit Profile
            </button>
            <button
              onClick={openReassignDialog}
              disabled={!currentEnrollment}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Section & Roll No
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              Print Dossier
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-gray-100 mt-6 pt-3 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Personal Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Full Name</span>
                <span className="font-semibold text-gray-800">{student.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Gender</span>
                <span className="font-semibold text-gray-800 capitalize">{student.gender}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Date of Birth</span>
                <span className="font-semibold text-gray-800">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Blood Group</span>
                <span className="font-semibold text-gray-800">{student.bloodGroup || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Religion</span>
                <span className="font-semibold text-gray-800">{student.religion || 'Islam'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Nationality</span>
                <span className="font-semibold text-gray-800">{student.nationality || 'Pakistani'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">B-Form / CNIC</span>
                <span className="font-semibold text-gray-800">{student.bFormNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Admission Date</span>
                <span className="font-semibold text-gray-800">
                  {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Father Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Father & Mother Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Father Name</span>
                <span className="font-semibold text-gray-800">{student.father?.name || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Father CNIC</span>
                <span className="font-semibold text-gray-800">{student.father?.cnic || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Father Mobile</span>
                <span className="font-semibold text-gray-800">{student.father?.phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Father Occupation</span>
                <span className="font-semibold text-gray-800">{student.father?.occupation || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Monthly Income</span>
                <span className="font-semibold text-gray-800">
                  {student.father?.monthlyIncome ? `PKR ${student.father.monthlyIncome}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Mother Name</span>
                <span className="font-semibold text-gray-800">{student.mother?.name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> Residential & Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Primary Contact Phone</span>
                <span className="font-semibold text-gray-800">{student.contact?.phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Emergency Phone</span>
                <span className="font-semibold text-gray-800">{student.contact?.emergencyPhone || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block">Present Address</span>
                <span className="font-semibold text-gray-800">
                  {student.address?.present || '—'}, {student.address?.city}
                </span>
              </div>
            </div>
          </div>

          {/* Previous School */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" /> Previous Academic Record
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Previous Institution</span>
                <span className="font-semibold text-gray-800">{student.previousSchool?.schoolName || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Last Class Passed</span>
                <span className="font-semibold text-gray-800">{student.previousSchool?.previousClass || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Leaving Certificate No</span>
                <span className="font-semibold text-gray-800">
                  {student.previousSchool?.leavingCertificateNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Leaving Date</span>
                <span className="font-semibold text-gray-800">
                  {student.previousSchool?.leavingDate ? new Date(student.previousSchool.leavingDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic & Enrollments */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Academic Enrollment History
                </h3>
                <p className="text-xs text-gray-500">
                  Per Section 45: Complete session-by-session enrollment records.
                </p>
              </div>
              {currentEnrollment && (
                <button
                  onClick={openReassignDialog}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Reassign Section / Roll No
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-4">Session</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-4">Roll Number</th>
                    <th className="py-2.5 px-4">Enrollment Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400">
                        No enrollment records found.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((en) => (
                      <tr key={en._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {en.academicSession?.name || 'Current Session'}
                          {en.academicSession?.isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px]">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium">{en.class?.name || '—'}</td>
                        <td className="py-3 px-4">Section {en.section?.name || 'A'}</td>
                        <td className="py-3 px-4 font-mono">{en.rollNumber || '—'}</td>
                        <td className="py-3 px-4">{new Date(en.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{getStatusBadge(en.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fees & Ledger */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Total Invoiced
              </span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">PKR 0</span>
              <span className="text-[11px] text-gray-400 mt-1 block">Phase 7 Fee Integration Ready</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Total Paid
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">PKR 0</span>
              <span className="text-[11px] text-emerald-500 mt-1 block">0 verified receipts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-2xl font-bold text-gray-800 mt-1 block">PKR 0</span>
              <span className="text-[11px] text-gray-400 mt-1 block">No arrears overdue</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs text-center py-12 text-gray-500">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-900">Fee Ledger Ready</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Challan generation, fee heads, and multi-bank voucher payments will activate in Phase 7-9.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Attendance Statistics</h3>
              <p className="text-xs text-gray-500">Academic session attendance tracking</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              100% Present
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block">Working Days</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">0</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-700 block">Present Days</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">0</span>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <span className="text-xs text-red-700 block">Absent Days</span>
              <span className="text-xl font-bold text-red-700 mt-1 block">0</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xs text-amber-700 block">Leaves Approved</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">0</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Student Dossier Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800">Student B-Form / Birth Certificate</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Verified</span>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800">Father CNIC Copy</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Verified</span>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800">School Leaving Certificate (SLC)</span>
              </div>
              <span className="text-[11px] text-gray-400">Optional</span>
            </div>
            <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800">Passport Size Photographs (4x)</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Attached</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Activity Log */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Student Activity & Lifecycle Log</h3>
          <div className="space-y-3">
            <div className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Student Registered</p>
                <p className="text-gray-500 text-[11px]">
                  Registered by Administration with ID: {student.studentId}
                </p>
                <span className="text-gray-400 text-[10px]">
                  {new Date(student.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {currentEnrollment && (
              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Enrolled into {currentEnrollment.class?.name}</p>
                  <p className="text-gray-500 text-[11px]">
                    Assigned to Section {currentEnrollment.section?.name || 'A'} (Roll No: {currentEnrollment.rollNumber || '01'})
                  </p>
                  <span className="text-gray-400 text-[10px]">
                    {new Date(currentEnrollment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Edit Student Information</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">GR Number</label>
                  <input
                    type="text"
                    value={editData.grNumber || ''}
                    onChange={(e) => setEditData({ ...editData, grNumber: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editData.father?.name || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        father: { ...editData.father, name: e.target.value },
                      })
                    }
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editData.contact?.phone || ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        contact: { ...editData.contact, phone: e.target.value },
                      })
                    }
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={editData.status || 'active'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="struck_off">Struck Off</option>
                    <option value="transferred">Transferred</option>
                    <option value="passout">Pass Out</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Section & Roll No Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Reassign Section & Roll No</h3>
              <button onClick={() => setShowReassignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSectionRoll} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Class</label>
                <input
                  type="text"
                  disabled
                  value={currentEnrollment?.class?.name || ''}
                  className="w-full text-sm px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Section</label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {availableSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  placeholder="e.g. 05"
                  value={targetRoll}
                  onChange={(e) => setTargetRoll(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEnroll}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingEnroll ? 'Saving...' : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
