import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Edit2,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    order: '',
    status: 'active',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'school_admin']);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      code: '',
      order: classes.length + 1,
      status: 'active',
      description: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      code: classItem.code || '',
      order: classItem.order || 0,
      status: classItem.status || 'active',
      description: classItem.description || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, formData);
        setSuccessMsg(`Class '${formData.name}' updated successfully`);
      } else {
        await api.post('/classes', formData);
        setSuccessMsg(`Class '${formData.name}' created successfully`);
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchClasses();
    } catch (err) {
      setModalError(err.message || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (classItem) => {
    if (!window.confirm(`Are you sure you want to delete '${classItem.name}'?`)) return;

    try {
      setError('');
      await api.delete(`/classes/${classItem._id}`);
      setSuccessMsg(`Class '${classItem.name}' deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Class Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic grade levels, ordering sequences, and curriculum groupings.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        )}
      </div>

      {/* Alert Messages */}
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

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No classes configured yet. Click "Create New Class" to begin.
          </div>
        ) : (
          classes.map((c) => {
            const sections = c.sections || [];
            return (
              <div
                key={c._id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                        {c.code || c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{c.name}</h3>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3" /> Order: {c.order}
                        </span>
                      </div>
                    </div>

                    {c.status === 'active' ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Sections preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                      Assigned Sections ({sections.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sections.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No sections</span>
                      ) : (
                        sections.map((sec) => (
                          <span
                            key={sec._id}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            Sec {sec.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/sections?classId=${c._id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <span>Manage Sections</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {canManage && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT CLASS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the name, sequence order, and status for this grade level.
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Class Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grade 7 or Play Group"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. G7"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    placeholder="1, 2, 3..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
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
                  {submitting ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
