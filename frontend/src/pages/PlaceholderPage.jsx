import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layers, ArrowRight, ShieldAlert } from 'lucide-react';

const phaseMap = {
  '/students': { title: 'Students Management', phase: 'Phase 5: Student Registration & Enrollment' },
  '/teachers': { title: 'Teachers Management', phase: 'Phase 4: Teacher Management & Assignments' },
  '/classes': { title: 'Class Management', phase: 'Phase 3: Academic Structure & Classes' },
  '/sections': { title: 'Section Management', phase: 'Phase 3: Academic Structure & Sections' },
  '/fees': { title: 'Fee Management', phase: 'Phase 7: Fee Structures & Policies' },
  '/payments': { title: 'Payment Processing', phase: 'Phase 9: Payments, Receipts & Gateways' },
  '/challans': { title: 'Challan System', phase: 'Phase 8: Invoices & Printable Challans' },
  '/reports': { title: 'Reporting & Analytics', phase: 'Phase 10: Reports & Export Engine' },
  '/promotions': { title: 'Student Promotions', phase: 'Phase 6: Session Promotion & History' },
  '/settings': { title: 'System Settings', phase: 'Phase 2 & 12: School Config & Permissions' },
};

export default function PlaceholderPage() {
  const location = useLocation();
  const info = phaseMap[location.pathname] || {
    title: 'Module',
    phase: 'Upcoming Development Phase',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
        <Layers className="w-7 h-7" />
      </div>

      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 mb-2">
        <ShieldAlert className="w-3.5 h-3.5" /> Scheduled Roadmap Module
      </span>

      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{info.title}</h2>
      <p className="text-xs text-slate-500 mt-2 max-w-md">
        This module will be built in <strong className="text-slate-700 font-semibold">{info.phase}</strong> as part of the phase-by-phase implementation plan.
      </p>

      <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-left w-full text-xs space-y-2 shadow-2xs">
        <div className="flex justify-between text-slate-600">
          <span>Active Phase:</span>
          <span className="font-semibold text-blue-600">Phase 1 (Project Foundation)</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Module Target:</span>
          <span className="font-semibold text-slate-700">{info.phase}</span>
        </div>
      </div>
    </div>
  );
}
