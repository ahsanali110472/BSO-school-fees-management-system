import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Sections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class: initialClassId,
    capacity: 40,
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'school_admin']);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClass) params.classId = selectedClass;
      const res = await api.get('/sections', { params });
      setSections(res.data.sections || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [selectedClass]);

  const handleClassFilterChange = (classId) => {
    setSelectedClass(classId);
    if (classId) {
      setSearchParams({ classId });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenAddModal = () => {
    setEditingSection(null);
    setFormData({
      name: '',
      class: selectedClass || (classes.length > 0 ? classes[0]._id : ''),
      capacity: 40,
      status: 'active',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (sec) => {
    setEditingSection(sec);
    setFormData({
      name: sec.name,
      class: sec.class?._id || sec.class,
      capacity: sec.capacity || 40,
      status: sec.status || 'active',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingSection) {
        await api.put(`/sections/${editingSection._id}`, formData);
        setSuccessMsg(`Section '${formData.name}' updated successfully`);
      } else {
        await api.post('/sections', formData);
        setSuccessMsg(`Section '${formData.name}' created successfully`);
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSections();
    } catch (err) {
      setModalError(err.message || 'Failed to save section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sec) => {
    if (!window.confirm(`Are you sure you want to delete section '${sec.name}'?`)) return;

    try {
      setError('');
      await api.delete(`/sections/${sec._id}`);
      setSuccessMsg(`Section '${sec.name}' deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSections();
    } catch (err) {
      setError(err.message || 'Failed to delete section');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Section Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage class sections, classroom seating capacity, and student allocations.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Section</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium">Filter by Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Classes (Showing All)</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400">Total Sections: {sections.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Section Name</th>
                <th className="py-3 px-4">Parent Class</th>
                <th className="py-3 px-4">Room Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading sections...
                  </td>
                </tr>
              ) : sections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No sections found. Click "Create New Section" to add one.
                  </td>
                </tr>
              ) : (
                sections.map((sec) => (
                  <tr key={sec._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
                          {sec.name}
                        </div>
                        <span>Section {sec.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{sec.class?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sec.capacity} students</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {sec.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(sec)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Section"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sec)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT SECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign a section to a grade level and define its maximum capacity.
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Parent Class <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="" disabled>
                    Select a class
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
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  placeholder="e.g. A, B, Blue, Green"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Room Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {submitting ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
