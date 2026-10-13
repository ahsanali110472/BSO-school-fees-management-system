import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  BookOpen,
  GraduationCap,
  MapPin,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown Reference Data
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  // Schedule Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    teacher: '',
    class: '',
    section: '',
    subject: '',
    room: 'Room 1',
  });
  const [modalSections, setModalSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'school_admin']);

  const fetchDropdownData = async () => {
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        api.get('/teachers?status=active'),
        api.get('/classes'),
        api.get('/subjects?status=active'),
      ]);
      setTeachers(tRes.data.teachers || []);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = { day: selectedDay };
      if (filterClass) params.classId = filterClass;
      if (filterTeacher) params.teacherId = filterTeacher;

      const res = await api.get('/timetable', { params });
      setTimetable(res.data.timetable || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [selectedDay, filterClass, filterTeacher]);

  const handleModalClassChange = async (classId) => {
    setFormData({ ...formData, class: classId, section: '' });
    try {
      const res = await api.get('/sections', { params: { classId } });
      setModalSections(res.data.sections || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      day: selectedDay,
      startTime: '09:00',
      endTime: '10:00',
      teacher: teachers.length > 0 ? teachers[0]._id : '',
      class: classes.length > 0 ? classes[0]._id : '',
      section: '',
      subject: subjects.length > 0 ? subjects[0]._id : '',
      room: 'Room 1',
    });
    if (classes.length > 0) {
      handleModalClassChange(classes[0]._id);
    }
    setModalError('');
    setShowModal(true);
  };

  const handleSchedulePeriod = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      await api.post('/timetable', formData);
      setSuccessMsg('Timetable period scheduled successfully');
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTimetable();
    } catch (err) {
      setModalError(err.message || 'Failed to schedule period');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this scheduled class period?')) return;
    try {
      await api.delete(`/timetable/${slotId}`);
      setSuccessMsg('Period deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTimetable();
    } catch (err) {
      setError(err.message || 'Failed to delete period');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Weekly Timetable Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate weekly classroom periods, teacher timetables, and conflict-free room allocations.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Period</span>
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

      {/* DAY TABS */}
      <div className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Class:</span>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <span>Filter Teacher:</span>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400">
          {selectedDay} Periods: {timetable.length}
        </span>
      </div>

      {/* TIMETABLE PERIODS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading {selectedDay} schedule...
          </div>
        ) : timetable.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white">
            No periods scheduled for {selectedDay}. Click "Schedule Period" to add one.
          </div>
        ) : (
          timetable.map((slot) => (
            <div
              key={slot._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {slot.startTime} - {slot.endTime}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <MapPin className="w-3 h-3 text-slate-400" /> {slot.room}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {slot.subject?.name}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 font-medium">
                    {slot.subject?.code}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      Class: {slot.class?.name} &bull; Section {slot.section?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Faculty: {slot.teacher?.name}</span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteSlot(slot._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                    title="Delete period"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SCHEDULE PERIOD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Schedule Class Period</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select teacher, class, time slot, and room. Conflicts will be automatically detected.
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSchedulePeriod} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Classroom / Room</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Room 4 or Lab 1"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teacher</label>
                  <select
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="" disabled>
                      Select Teacher
                    </option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.teacherId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                  <select
                    required
                    value={formData.class}
                    onChange={(e) => handleModalClassChange(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                  <select
                    required
                    disabled={!formData.class}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-50"
                  >
                    <option value="" disabled>
                      Select Section
                    </option>
                    {modalSections.map((s) => (
                      <option key={s._id} value={s._id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject Course</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  {submitting ? 'Checking Conflicts...' : 'Confirm Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
