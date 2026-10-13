import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Download,
  IdCard,
  Edit2,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  Phone,
  Calendar,
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

export default function Students() {
  const navigate = useNavigate();

  // Data states
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Bulk selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkActionModal, setBulkActionModal] = useState(null); // 'status' | 'section'
  const [bulkTargetStatus, setBulkTargetStatus] = useState('active');
  const [bulkTargetSection, setBulkTargetSection] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Quick edit modal
  const [editStudentModal, setEditStudentModal] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', grNumber: '', phone: '', status: 'active' });
  const [savingEdit, setSavingEdit] = useState(false);

  // ID Cards Preview Modal
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Bulk CSV Import Modal states
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [importingBulk, setImportingBulk] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState(null);
  const [bulkImportError, setBulkImportError] = useState('');

  useEffect(() => {
    fetchFilterDropdowns();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, limit, selectedClass, selectedSection, selectedSession, selectedStatus]);

  const fetchFilterDropdowns = async () => {
    try {
      const [classRes, secRes, sessRes] = await Promise.all([
        api.get('/classes'),
        api.get('/sections'),
        api.get('/sessions'),
      ]);
      const classesList = classRes?.data?.classes || classRes?.data?.data?.classes || [];
      const sectionsList = secRes?.data?.sections || secRes?.data?.data?.sections || [];
      const sessionsList = sessRes?.data?.sessions || sessRes?.data?.data?.sessions || [];

      setClasses(classesList);
      setSections(sectionsList);
      setSessions(sessionsList);

      // Auto-set current session if present
      const current = sessionsList.find((s) => s.isCurrent);
      if (current) setSelectedSession(current._id);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        classId: selectedClass || undefined,
        sectionId: selectedSection || undefined,
        sessionId: selectedSession || undefined,
        status: selectedStatus || undefined,
      };

      const res = await api.get('/students', { params });
      const studentsList = res?.data?.students || res?.data?.data?.students || [];
      const pag = res?.data?.pagination || res?.data?.data?.pagination || { total: 0, pages: 1 };
      setStudents(studentsList);
      setPagination(pag);
      setSelectedStudentIds([]); // Clear selections on page/filter change
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedStatus('');
    setPage(1);
    fetchStudents();
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s._id));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Bulk Status Update
  const handleExecuteBulkStatus = async () => {
    if (!selectedStudentIds.length) return;
    setBulkProcessing(true);
    try {
      const res = await api.post('/students/bulk-status', {
        studentIds: selectedStudentIds,
        status: bulkTargetStatus,
      });
      setActionSuccess(res.data.message || 'Bulk status updated successfully.');
      setBulkActionModal(null);
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student statuses.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Quick edit student
  const openEditModal = (s) => {
    setEditStudentModal(s);
    setEditFormData({
      name: s.name || '',
      grNumber: s.grNumber || '',
      phone: s.contact?.phone || '',
      status: s.status || 'active',
    });
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setError(null);
    try {
      await api.put(`/students/${editStudentModal._id}`, {
        name: editFormData.name,
        grNumber: editFormData.grNumber || undefined,
        status: editFormData.status,
        contact: {
          ...editStudentModal.contact,
          phone: editFormData.phone,
        },
      });
      setActionSuccess(`Student '${editFormData.name}' updated successfully.`);
      setEditStudentModal(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student details.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = ['Student ID', 'GR No', 'Admission No', 'Name', 'Gender', 'Father Name', 'Phone', 'Class', 'Section', 'Roll No', 'Status'];
    const rows = students.map((s) => [
      s.studentId,
      s.grNumber || '',
      s.admissionNumber || '',
      `"${s.name.replace(/"/g, '""')}"`,
      s.gender,
      `"${(s.father?.name || '').replace(/"/g, '""')}"`,
      s.contact?.phone || '',
      s.currentClass?.name || '',
      s.currentSection?.name || '',
      s.rollNumber || '',
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download official CSV template
  const handleDownloadCsvTemplate = async () => {
    try {
      const response = await api.get('/students/bulk-template', { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Bulk_Import_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download template:', err);
      setError('Failed to download CSV template');
    }
  };

  // Handle CSV file selection & parsing for preview
  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setBulkImportResult(null);
    setBulkImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvRawText(text);

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setBulkImportError('Selected CSV file appears to be empty or missing headers.');
          setCsvPreviewRows([]);
          return;
        }

        const parseLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]);
        const preview = [];
        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const vals = parseLine(lines[i]);
          if (!vals.length || (vals.length === 1 && vals[0] === '')) continue;
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = vals[idx] || '';
          });
          preview.push(rowObj);
        }
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  // Execute bulk import
  const handleExecuteBulkImport = async () => {
    if (!csvRawText) {
      setBulkImportError('Please select a valid CSV file first.');
      return;
    }
    setImportingBulk(true);
    setBulkImportError('');
    setBulkImportResult(null);
    try {
      const res = await api.post('/students/bulk-import', { csvData: csvRawText });
      const data = res?.data?.data || res?.data;
      setBulkImportResult(data);
      setActionSuccess(`Successfully imported ${data.importedCount} student(s)!`);
      fetchStudents();
    } catch (err) {
      console.error('Bulk import error:', err);
      setBulkImportError(err.response?.data?.message || 'Failed to complete bulk import.');
    } finally {
      setImportingBulk(false);
    }
  };

  // Status color helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>;
      case 'struck_off':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Struck Off</span>;
      case 'transferred':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Transferred</span>;
      case 'passout':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Pass Out</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const filteredSections = selectedClass
    ? sections.filter((sec) => (sec.class?._id || sec.class) === selectedClass)
    : sections;

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Student Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain complete student lifecycle, academic enrollments, and directories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/students/register')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            Register Student
          </button>
          <button
            onClick={() => {
              setShowBulkImportModal(true);
              setBulkImportResult(null);
              setBulkImportError('');
              setCsvRawText('');
              setCsvPreviewRows([]);
              setCsvFileName('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            Bulk Import (CSV)
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!students.length}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={() => setShowIdCardModal(true)}
            disabled={!students.length}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <IdCard className="w-4 h-4 text-gray-500" />
            ID Cards
          </button>
          <button
            onClick={fetchStudents}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, Student ID, GR No, Roll No, Phone, Father Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition"
          >
            Search
          </button>
          {(search || selectedClass || selectedSection || selectedStatus) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Sessions</option>
              {sessions.map((sess) => (
                <option key={sess._id} value={sess._id}>
                  {sess.name} {sess.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Sections</option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs py-1.5 px-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="struck_off">Struck Off</option>
              <option value="transferred">Transferred</option>
              <option value="passout">Pass Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm text-indigo-900 font-medium">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>{selectedStudentIds.length} student(s) selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setBulkActionModal('status')}
              className="px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md shadow-xs transition"
            >
              Change Status
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 bg-transparent hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-800">
                    {students.length > 0 && selectedStudentIds.length === students.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">GR & Admission</th>
                <th className="py-3 px-4">Class / Section</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Father & Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No students found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Try adjusting your search criteria or register a new student.
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isSelected = selectedStudentIds.includes(s._id);
                  return (
                    <tr
                      key={s._id}
                      className={`hover:bg-gray-50 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="p-4">
                        <button onClick={() => handleSelectRow(s._id)} className="text-gray-400 hover:text-gray-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {s.name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <span
                              onClick={() => navigate(`/students/${s._id}`)}
                              className="font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer block"
                            >
                              {s.name}
                            </span>
                            <span className="text-xs text-gray-400 font-mono block">
                              {s.studentId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-800">{s.grNumber || '—'}</span>
                          <span className="block text-gray-400">{s.admissionNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.currentClass ? (
                          <div className="text-xs">
                            <span className="font-medium text-gray-900">{s.currentClass.name}</span>
                            <span className="text-gray-500 block">Section {s.currentSection?.name || 'A'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not enrolled</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-medium">
                          {s.rollNumber || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="text-gray-900 font-medium">{s.father?.name || '—'}</span>
                          <span className="block text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {s.contact?.phone || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/students/${s._id}`)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded-md transition"
                            title="Quick Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-xs outline-hidden"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-gray-400">|</span>
            <span>
              Showing {students.length === 0 ? 0 : (page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, pagination.total)} of {pagination.total} students
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-800">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Quick Edit Student</h3>
              <button
                onClick={() => setEditStudentModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GR Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GR-801"
                  value={editFormData.grNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, grNumber: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="struck_off">Struck Off</option>
                  <option value="transferred">Transferred</option>
                  <option value="passout">Pass Out</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditStudentModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Status Modal */}
      {bulkActionModal === 'status' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Bulk Update Status</h3>
            <p className="text-xs text-gray-500">
              Apply new status to {selectedStudentIds.length} selected student(s).
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Status</label>
              <select
                value={bulkTargetStatus}
                onChange={(e) => setBulkTargetStatus(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="struck_off">Struck Off</option>
                <option value="transferred">Transferred</option>
                <option value="passout">Pass Out</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setBulkActionModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkStatus}
                disabled={bulkProcessing}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {bulkProcessing ? 'Processing...' : 'Apply Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Cards Preview Modal */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Student ID Cards Preview</h3>
                <p className="text-xs text-gray-500">Official printable student identification badges</p>
              </div>
              <button
                onClick={() => setShowIdCardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
              {students.slice(0, 4).map((s) => (
                <div
                  key={s._id}
                  className="border-2 border-indigo-500/30 rounded-xl p-4 bg-linear-to-br from-indigo-50/50 to-white shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-3">
                    <span className="font-bold text-xs text-indigo-900 tracking-wider">
                      BSO MODEL HIGH SCHOOL
                    </span>
                    <span className="text-[10px] uppercase font-bold text-indigo-600">STUDENT</span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-16 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center justify-center font-bold text-indigo-700 text-lg flex-shrink-0">
                      {s.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                      <div className="text-gray-600 font-mono text-[11px]">ID: {s.studentId}</div>
                      <div className="text-gray-600">GR: {s.grNumber || 'N/A'}</div>
                      <div className="text-gray-700 font-medium">
                        Class: {s.currentClass?.name || 'N/A'} - {s.currentSection?.name || 'A'}
                      </div>
                      <div className="text-gray-500 text-[10px]">Father: {s.father?.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-indigo-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Roll: {s.rollNumber || '01'}</span>
                    <span className="font-mono">Valid 2026</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
              >
                Print Badges
              </button>
              <button
                onClick={() => setShowIdCardModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Bulk Student Admission (CSV)</h3>
                  <p className="text-xs text-gray-500">
                    Register and enroll students in batch using standard CSV templates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Step 1: Download Template
                </span>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Includes all student fields: Name, DOB, Gender, Father details, Contact, Address, Class, Section, Roll No.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </button>
            </div>

            {/* Step 2: Upload CSV */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Step 2: Upload Completed CSV File
              </span>
              <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-5 text-center bg-gray-50/50 transition">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    Click to select or drag and drop CSV file
                  </span>
                  <span className="text-[11px] text-gray-400">Supported format: .csv (UTF-8, comma separated)</span>
                </label>
                {csvFileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-medium shadow-xs">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{csvFileName}</span>
                    <span className="text-[10px] text-gray-400">
                      ({csvPreviewRows.length > 0 ? `${csvPreviewRows.length}+ rows detected` : 'parsing'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message if any */}
            {bulkImportError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
                <span>{bulkImportError}</span>
                <button onClick={() => setBulkImportError('')} className="text-rose-500 font-bold ml-2">
                  ×
                </button>
              </div>
            )}

            {/* Step 3: Preview Table */}
            {csvPreviewRows.length > 0 && !bulkImportResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Step 3: Preview First {csvPreviewRows.length} Rows
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">Ready for import</span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px] text-gray-600">
                    <thead className="bg-gray-50 font-semibold text-gray-700 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">DOB</th>
                        <th className="px-3 py-2">Gender</th>
                        <th className="px-3 py-2">Father Name</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Class</th>
                        <th className="px-3 py-2">Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {csvPreviewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/80">
                          <td className="px-3 py-1.5 font-medium text-gray-900">{r.Name || r.name || '-'}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{r.DateOfBirth || r.dateOfBirth || '-'}</td>
                          <td className="px-3 py-1.5 capitalize">{r.Gender || r.gender || '-'}</td>
                          <td className="px-3 py-1.5">{r.FatherName || r.fatherName || '-'}</td>
                          <td className="px-3 py-1.5">{r.ContactPhone || r.contactPhone || '-'}</td>
                          <td className="px-3 py-1.5 font-semibold text-indigo-600">
                            {r.Class || r.class || '-'}
                          </td>
                          <td className="px-3 py-1.5">{r.Section || r.section || 'A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Results Summary */}
            {bulkImportResult && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    Import Complete: {bulkImportResult.importedCount} of {bulkImportResult.totalProcessed} students admitted successfully!
                  </span>
                </div>

                {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-bold text-rose-700">
                      Skipped Rows with Issues ({bulkImportResult.errors.length}):
                    </span>
                    <div className="border border-rose-200 bg-white rounded-lg max-h-32 overflow-y-auto divide-y divide-rose-100 text-xs text-rose-600">
                      {bulkImportResult.errors.map((err, i) => (
                        <div key={i} className="px-3 py-1.5 flex justify-between">
                          <span>
                            <strong>Row {err.row}:</strong> {err.name}
                          </span>
                          <span>{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                {bulkImportResult ? 'Close' : 'Cancel'}
              </button>

              {!bulkImportResult && (
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={importingBulk || !csvRawText}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {importingBulk ? 'Importing Students...' : 'Confirm & Import Students'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
