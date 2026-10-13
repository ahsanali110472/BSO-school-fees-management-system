import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Building,
  Calendar,
  ShieldCheck,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function TransferCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('Parent job transfer to another city');
  const [conduct, setConduct] = useState('Good');
  const [remarks, setRemarks] = useState('All school dues, library books, and sports equipment cleared.');
  const [duesCleared, setDuesCleared] = useState(true);
  const [issuing, setIssuing] = useState(false);

  // Print Preview modal
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    fetchCertificates();
    fetchActiveStudents();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transfers');
      setCertificates(res?.data?.certificates || res?.data?.data?.certificates || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError('Could not load transfer certificates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveStudents = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 100, status: 'active' } });
      setStudents(res?.data?.students || res?.data?.data?.students || []);
    } catch (err) {
      console.error('Failed to load active students:', err);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }

    setIssuing(true);
    setError(null);
    try {
      const res = await api.post('/transfers/issue', {
        studentId: selectedStudentId,
        reasonForLeaving,
        conduct,
        remarks,
        duesCleared,
      });

      setSuccessMsg(`Transfer Certificate ${res.data.data.certificate.certificateNumber} issued successfully.`);
      setShowIssueModal(false);
      setSelectedStudentId('');
      fetchCertificates();
      fetchActiveStudents();
    } catch (err) {
      console.error('Issuance failed:', err);
      setError(err.response?.data?.message || 'Failed to issue transfer certificate.');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Transfer Certificates & School Leaving
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Section 18: Issue, record, and print official School Leaving Certificates (SLC / TC) with sequential serial tracking.
          </p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Issue Transfer Certificate
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Issued
          </span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{certificates.length}</span>
          <span className="text-[11px] text-gray-400 mt-1 block">Lifetime leaving records</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Dues Cleared
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {certificates.filter((c) => c.duesCleared).length}
          </span>
          <span className="text-[11px] text-emerald-500 mt-1 block">100% financial compliance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Current Year ({new Date().getFullYear()})
          </span>
          <span className="text-2xl font-bold text-indigo-600 mt-1 block">
            {certificates.length}
          </span>
          <span className="text-[11px] text-indigo-500 mt-1 block">Official series active</span>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-gray-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Issued Transfer Certificates</h3>
          <span className="text-xs text-gray-500 font-mono">Series: TC-YYYY-XXXX</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-100/75 uppercase text-gray-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Last Class / Section</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Reason For Leaving</th>
                <th className="py-3 px-4">Conduct</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 space-y-2">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm font-medium text-gray-800">No transfer certificates issued yet</p>
                    <p className="text-xs text-gray-500">
                      When students relocate or graduate, issue an official Leaving Certificate here.
                    </p>
                  </td>
                </tr>
              ) : (
                certificates.map((tc) => (
                  <tr key={tc._id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {tc.certificateNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-gray-900 block">{tc.student?.name}</span>
                        <span className="text-gray-400 text-[11px] font-mono">
                          ID: {tc.student?.studentId} | GR: {tc.student?.grNumber || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {tc.lastClass?.name} ({tc.lastSection?.name ? `Sec ${tc.lastSection.name}` : 'A'})
                    </td>
                    <td className="py-3 px-4">
                      {new Date(tc.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-700">
                      {tc.reasonForLeaving}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        {tc.conduct}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCertificate(tc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-gray-500" />
                        Print Certificate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Issue School Leaving Certificate</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Active Student <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Choose enrolled student --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.studentId}) - {s.currentClass?.name || 'Class'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Note: Issuing a TC automatically transitions student status to 'Transferred'.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Leaving <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reasonForLeaving}
                  onChange={(e) => setReasonForLeaving(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">General Conduct</label>
                  <select
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={duesCleared}
                      onChange={(e) => setDuesCleared(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    All School Dues Cleared
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Note</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {issuing ? 'Issuing Certificate...' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-1 border-b-2 border-indigo-900 pb-4">
              <h2 className="text-xl font-bold tracking-wider text-indigo-950 uppercase font-serif">
                BSO MODEL HIGH SCHOOL
              </h2>
              <p className="text-xs text-gray-600">
                Recognized & Registered with Board of Intermediate & Secondary Education
              </p>
              <div className="pt-2">
                <span className="px-4 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-widest rounded-full inline-block">
                  School Leaving / Transfer Certificate
                </span>
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Certificate No:</span>
                <span className="font-mono font-bold text-indigo-900">
                  {selectedCertificate.certificateNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Date of Issue:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-xs leading-relaxed text-gray-800">
              <p>
                This is to certify that{' '}
                <strong className="underline decoration-indigo-400 font-bold">
                  {selectedCertificate.student?.name}
                </strong>
                , son/daughter of{' '}
                <strong className="underline decoration-indigo-400 font-bold">
                  {selectedCertificate.student?.father?.name || '—'}
                </strong>
                , bearing Admission No.{' '}
                <strong className="font-mono font-bold">
                  {selectedCertificate.student?.admissionNumber}
                </strong>{' '}
                and General Register (G.R.) No.{' '}
                <strong className="font-mono font-bold">
                  {selectedCertificate.student?.grNumber || 'N/A'}
                </strong>
                , was a bonafide student of this institution.
              </p>

              <p>
                His/Her date of birth according to the school general admission register is{' '}
                <strong>
                  {selectedCertificate.student?.dateOfBirth
                    ? new Date(selectedCertificate.student.dateOfBirth).toLocaleDateString()
                    : 'N/A'}
                </strong>
                .
              </p>

              <p>
                He/She was studying in class{' '}
                <strong className="text-indigo-900 font-bold">
                  {selectedCertificate.lastClass?.name}
                </strong>{' '}
                at the time of leaving the school.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500">Reason for leaving:</span>{' '}
                  <strong className="text-gray-900">{selectedCertificate.reasonForLeaving}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Conduct:</span>{' '}
                  <strong className="text-emerald-700">{selectedCertificate.conduct}</strong>
                </div>
                <div>
                  <span className="text-gray-500">School Dues:</span>{' '}
                  <strong className="text-emerald-700">Cleared</strong>
                </div>
                <div>
                  <span className="text-gray-500">Session:</span>{' '}
                  <strong className="text-gray-900">{selectedCertificate.lastSession?.name}</strong>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex justify-between items-end text-xs text-gray-600">
              <div className="text-center">
                <div className="w-36 border-b border-gray-400 mb-1" />
                <span>Class Teacher</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-gray-400 mb-1" />
                <span>Administrative Officer</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-b-2 border-indigo-900 mb-1" />
                <span className="font-bold text-gray-900">Principal / Headmaster</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Print Certificate
              </button>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
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
