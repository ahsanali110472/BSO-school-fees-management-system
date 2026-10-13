import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Classes from './pages/Classes';
import Sections from './pages/Sections';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import Timetable from './pages/Timetable';
import Students from './pages/Students';
import StudentRegistration from './pages/StudentRegistration';
import StudentProfile from './pages/StudentProfile';
import Promotions from './pages/Promotions';
import TransferCertificates from './pages/TransferCertificates';
import FeeStructure from './pages/FeeStructure';
import Challans from './pages/Challans';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Workspace */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Super Admin Only: User Management */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Academic & Student Modules */}
            <Route
              path="students"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="students/register"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <StudentRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="students/:id"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="teachers"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Teachers />
                </ProtectedRoute>
              }
            />
            <Route
              path="timetable"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Timetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="classes"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="sections"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Sections />
                </ProtectedRoute>
              }
            />
            <Route
              path="subjects"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Subjects />
                </ProtectedRoute>
              }
            />

            {/* Fee & Financial Modules */}
            <Route
              path="fees"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'accountant']}>
                  <FeeStructure />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'accountant']}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="challans"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'accountant']}>
                  <Challans />
                </ProtectedRoute>
              }
            />

            {/* Reports & Operations */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'accountant']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotions"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Promotions />
                </ProtectedRoute>
              }
            />
            <Route
              path="transfers"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <TransferCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
