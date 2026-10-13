import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  FlaskConical,
  GraduationCap
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'theory',
    description: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'school_admin']);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/subjects', { params });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch curriculum subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [typeFilter]);

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      description: '',
      status: 'active',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      code: sub.code,
      type: sub.type || 'theory',
      description: sub.description || '',
      status: sub.status || 'active',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        setSuccessMsg(`Subject '${formData.name}' updated successfully`);
      } else {
        await api.post('/subjects', formData);
        setSuccessMsg(`Subject '${formData.name}' created successfully`);
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSubjects();
    } catch (err) {
      setModalError(err.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Are you sure you want to delete '${sub.name}'?`)) return;

    try {
      setError('');
      await api.delete(`/subjects/${sub._id}`);
      setSuccessMsg(`Subject '${sub.name}' deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'practical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            <FlaskConical className="w-3 h-3" /> Practical
          </span>
        );
      case 'both':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            Theory & Practical
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Theory Only
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subject Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school curriculum courses, subject codes, and practical laboratory criteria.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Subject</span>
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium">Filter by Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="theory">Theory</option>
            <option value="practical">Practical</option>
            <option value="both">Theory & Practical</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">Total Subjects: {subjects.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading curriculum subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No subjects found. Click "Create New Subject" to add one.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                          {sub.code.charAt(0)}
                        </div>
                        <div>
                          <span>{sub.name}</span>
                          {sub.description && (
                            <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs font-semibold">
                      {sub.code}
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(sub.type)}</td>
                    <td className="py-3 px-4">
                      {sub.status === 'active' ? (
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
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Subject"
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

      {/* CREATE / EDIT SUBJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {editingSubject ? 'Edit Subject' : 'Create New Subject'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify subject details, unique code, and theoretical/practical classification.
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MATH-101"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Course Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="theory">Theory Only</option>
                    <option value="practical">Practical Only</option>
                    <option value="both">Theory & Practical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional syllabus description..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
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
                  {submitting ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
