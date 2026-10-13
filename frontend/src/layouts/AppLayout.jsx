import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CreditCard,
  Receipt,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  ShieldCheck,
  UserCog,
  Menu,
  ChevronLeft,
  Bell,
  Search,
  LogOut,
  Minus,
  Square,
  X,
  BookMarked,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Master navigation definitions with role permissions (Section 5)
const allNavigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'school_admin', 'accountant'] },
  { name: 'User Management', path: '/users', icon: UserCog, roles: ['super_admin'] },
  { name: 'Students', path: '/students', icon: Users, roles: ['super_admin', 'school_admin'] },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap, roles: ['super_admin', 'school_admin'] },
  { name: 'Classes', path: '/classes', icon: BookOpen, roles: ['super_admin', 'school_admin'] },
  { name: 'Sections', path: '/sections', icon: Layers, roles: ['super_admin', 'school_admin'] },
  { name: 'Subjects', path: '/subjects', icon: BookMarked, roles: ['super_admin', 'school_admin'] },
  { name: 'Timetable', path: '/timetable', icon: Calendar, roles: ['super_admin', 'school_admin'] },
  { name: 'Fees', path: '/fees', icon: CreditCard, roles: ['super_admin', 'school_admin', 'accountant'] },
  { name: 'Payments', path: '/payments', icon: Receipt, roles: ['super_admin', 'accountant'] },
  { name: 'Challans', path: '/challans', icon: FileText, roles: ['super_admin', 'accountant'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['super_admin', 'school_admin', 'accountant'] },
  { name: 'Promotions', path: '/promotions', icon: TrendingUp, roles: ['super_admin', 'school_admin'] },
  { name: 'Transfer Certificates', path: '/transfers', icon: FileText, roles: ['super_admin', 'school_admin'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['super_admin', 'school_admin'] },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      setIsElectron(true);
    }

    // Fetch active academic session
    const fetchSession = async () => {
      try {
        const res = await api.get('/sessions/current');
        if (res.data?.session) {
          setCurrentSession(res.data.session);
        }
      } catch (err) {
        console.error('Could not fetch active session:', err);
      }
    };
    fetchSession();
  }, []);

  // Filter navigation items by current user's role
  const visibleNavItems = allNavigationItems.filter((item) => item.roles.includes(role));

  const currentItem = allNavigationItems.find(
    (item) => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
  );

  const pageTitle = currentItem ? currentItem.name : 'BSO School Management';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'super_admin':
        return 'Super Administrator';
      case 'school_admin':
        return 'School Administrator';
      case 'accountant':
        return 'Accountant';
      default:
        return 'Staff Member';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
      {/* SIDEBAR */}
      <aside
        className={`flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
          {!collapsed && (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/30 shrink-0">
                B
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-white tracking-tight text-sm truncate">
                  BSO School System
                </span>
                <span className="text-[11px] text-blue-400 font-medium">Enterprise Suite</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/30">
              B
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`shrink-0 transition-colors ${
                    collapsed ? 'mx-auto w-5 h-5' : 'mr-3 w-5 h-5'
                  } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Active User Summary at Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Staff User'}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline shrink-0" />
                  <span className="truncate">{getRoleDisplayName(role)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0 shadow-xs">
          {/* Left: Page Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">{pageTitle}</h1>

            {/* Academic Session Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Session: {currentSession?.name || '2026-27'}</span>
            </div>
          </div>

          {/* Right: Search, Notifications, User Badge, Logout, Electron Window Controls */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Role Badge */}
            <span className="hidden lg:inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
              {getRoleDisplayName(role)}
            </span>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Electron Window Controls if running inside desktop shell */}
            {isElectron && (
              <div className="flex items-center space-x-1 border-l border-slate-200 pl-3 ml-2">
                <button
                  onClick={() => window.electronAPI?.minimize()}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                  title="Minimize"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => window.electronAPI?.maximize()}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                  title="Maximize"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => window.electronAPI?.close()}
                  className="p-1.5 text-slate-500 hover:bg-rose-600 hover:text-white rounded transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
