import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  BookOpen,
  Award,
  Layers,
  X,
  UserCheck,
  Building
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile Modal State
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherTimetable, setTeacherTimetable] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  // Add/Edit Teacher Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    address: '',
    qualification: '',
    status: 'active',
  });
  const [submittingTeacher, setSubmittingTeacher] = useState(false);
  const [teacherModalError, setTeacherModalError] = useState('');

  // Assign Subject Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignForm, setAssignForm] = useState({
    class: '',
    section: '',
    subject: '',
    isClassTeacher: false,
  });
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignModalError, setAssignModalError] = useState('');

  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'school_admin']);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/teachers', { params });
      setTeachers(res.data.teachers || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicDropdowns = async () => {
    try {
      const [classRes, subRes] = await Promise.all([api.get('/classes'), api.get('/subjects')]);
      setClasses(classRes.data.classes || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchAcademicDropdowns();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeachers();
  };

  const handleOpenProfile = async (teacher) => {
    setSelectedTeacher(teacher);
    setProfileLoading(true);
    try {
      const res = await api.get(`/teachers/${teacher._id}`);
      setSelectedTeacher(res.data.teacher);
      setTeacherTimetable(res.data.timetable || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      name: '',
      fatherName: '',
      cnic: '',
      phone: '',
      email: '',
      address: '',
      qualification: '',
      status: 'active',
    });
    setTeacherModalError('');
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherForm({
      name: t.name,
      fatherName: t.fatherName || '',
      cnic: t.cnic || '',
      phone: t.phone || '',
      email: t.email || '',
      address: t.address || '',
      qualification: t.qualification || '',
      status: t.status || 'active',
    });
    setTeacherModalError('');
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setTeacherModalError('');
    setSubmittingTeacher(true);

    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, teacherForm);
        setSuccessMsg(`Teacher '${teacherForm.name}' updated successfully`);
      } else {
        await api.post('/teachers', teacherForm);
        setSuccessMsg(`Teacher '${teacherForm.name}' registered successfully`);
      }
      setShowTeacherModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTeachers();
    } catch (err) {
      setTeacherModalError(err.message || 'Failed to save teacher');
    } finally {
      setSubmittingTeacher(false);
    }
  };

  // Section dropdown loader on class select in assignment modal
  const handleAssignClassChange = async (classId) => {
    setAssignForm({ ...assignForm, class: classId, section: '' });
    try {
      const res = await api.get('/sections', { params: { classId } });
      setSections(res.data.sections || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setAssignModalError('');
    setSubmittingAssign(true);

    try {
      await api.post('/teacher-assignments', {
        ...assignForm,
        teacher: selectedTeacher._id,
      });
      setShowAssignModal(false);
      setSuccessMsg('Teaching assignment assigned successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      // Refresh teacher profile
      handleOpenProfile(selectedTeacher);
      fetchTeachers();
    } catch (err) {
      setAssignModalError(err.message || 'Failed to create teaching assignment');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this teaching assignment?')) return;
    try {
      await api.delete(`/teacher-assignments/${assignmentId}`);
      handleOpenProfile(selectedTeacher);
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Teacher Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain faculty profiles, qualifications, subject assignments, and class teacher roles.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddTeacher}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, CNIC, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-slate-400 ml-2">Total Faculty: {teachers.length}</span>
        </div>
      </div>

      {/* Teachers Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading faculty profiles...
          </div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No teachers found matching criteria. Click "Add New Teacher" to register.
          </div>
        ) : (
          teachers.map((t) => {
            const assignments = t.assignments || [];
            return (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {t.name.replace('Mr. ', '').replace('Ms. ', '').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t.name}</h3>
                        <span className="inline-block font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.2 rounded border border-blue-200/60 mt-0.5">
                          {t.teacherId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        t.status === 'active'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.qualification || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.phone}</span>
                    </div>
                    {t.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Teaching Assignments Badge Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                      Assigned Subjects ({assignments.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assignments.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No assigned subjects</span>
                      ) : (
                        assignments.slice(0, 3).map((a) => (
                          <span
                            key={a._id}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {a.subject?.code} ({a.class?.name}-{a.section?.name})
                          </span>
                        ))
                      )}
                      {assignments.length > 3 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 text-slate-500">
                          +{assignments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenProfile(t)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Full Profile &rarr;
                  </button>

                  {canManage && (
                    <button
                      onClick={() => handleOpenEditTeacher(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TEACHER PROFILE & ASSIGNMENTS DRAWER / MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedTeacher.name}</h3>
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedTeacher.teacherId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTeacher.qualification || 'Faculty Member'} &bull; Status: {selectedTeacher.status}
                </p>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {selectedTeacher.email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">CNIC</span>
                <span className="font-semibold text-slate-800">{selectedTeacher.cnic || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Father Name</span>
                <span className="font-semibold text-slate-800">
                  {selectedTeacher.fatherName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Joining Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedTeacher.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Address</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {selectedTeacher.address || 'N/A'}
                </span>
              </div>
            </div>

            {/* Teaching Assignments Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Teaching Assignments
                </h4>
                {canManage && (
                  <button
                    onClick={() => {
                      setAssignForm({ class: '', section: '', subject: '', isClassTeacher: false });
                      setAssignModalError('');
                      setShowAssignModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Subject
                  </button>
                )}
              </div>

              {(!selectedTeacher.assignments || selectedTeacher.assignments.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                  No courses or classes assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTeacher.assignments.map((a) => (
                    <div
                      key={a._id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                          {a.subject?.code?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {a.subject?.name} ({a.subject?.code})
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Class: {a.class?.name} &bull; Section: {a.section?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {a.isClassTeacher && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Class Teacher
                          </span>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleDeleteAssignment(a._id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Timetable Preview */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Weekly Schedule Preview
              </h4>
              {teacherTimetable.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                  No timetable slots scheduled.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teacherTimetable.map((slot) => (
                    <div
                      key={slot._id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {slot.day}: {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {slot.subject?.name} &bull; {slot.class?.name}-{slot.section?.name}
                        </span>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        {slot.room}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT TEACHER MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingTeacher ? 'Edit Teacher Profile' : 'Register New Faculty Member'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter official teacher identity, CNIC, and contact information.
            </p>

            {teacherModalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {teacherModalError}
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    placeholder="e.g. Mr. Muhammad Tariq"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Father Name</label>
                  <input
                    type="text"
                    value={teacherForm.fatherName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fatherName: e.target.value })}
                    placeholder="Father Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CNIC (Optional)</label>
                  <input
                    type="text"
                    value={teacherForm.cnic}
                    onChange={(e) => setTeacherForm({ ...teacherForm, cnic: e.target.value })}
                    placeholder="42101-XXXXXXX-X"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0300-XXXXXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="teacher@school.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Qualifications & Degrees
                  </label>
                  <input
                    type="text"
                    value={teacherForm.qualification}
                    onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                    placeholder="e.g. M.Sc. Mathematics, B.Ed"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={teacherForm.address}
                    onChange={(e) => setTeacherForm({ ...teacherForm, address: e.target.value })}
                    placeholder="Residential address"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={teacherForm.status}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeacher}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  {submittingTeacher ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SUBJECT MODAL */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Assign Subject & Class</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign teaching workload to <span className="font-semibold text-slate-800">{selectedTeacher.name}</span>
            </p>

            {assignModalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {assignModalError}
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Class <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.class}
                  onChange={(e) => handleAssignClassChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="" disabled>
                    Select Class
                  </option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Section <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!assignForm.class}
                  value={assignForm.section}
                  onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-50"
                >
                  <option value="" disabled>
                    Select Section
                  </option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject Course <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignForm.subject}
                  onChange={(e) => setAssignForm({ ...assignForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="" disabled>
                    Select Subject
                  </option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.isClassTeacher}
                    onChange={(e) => setAssignForm({ ...assignForm, isClassTeacher: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Designate as Class Teacher for this section</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
