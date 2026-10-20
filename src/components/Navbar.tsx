import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  MessageSquare,
  Bell,
  User,
  PlusCircle,
  Menu,
  X,
  LogOut,
  SlidersHorizontal,
  FolderGit2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationAsRead } from '../firebase/marketplaceService';
import { AppNotification } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
  onSelectWorker?: (workerUid: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { currentUser, userAccount, activeRole, setActiveRole, signOut, workerProfile, clientProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (currentUser) {
      getNotifications(currentUser.uid).then(setNotifications);
      const interval = setInterval(() => {
        getNotifications(currentUser.uid).then(setNotifications);
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    setNotifDropdownOpen(false);
    if (notif.link?.includes('dashboard')) {
      setCurrentTab('dashboard');
    } else if (notif.link?.includes('projects')) {
      setCurrentTab('projects');
    } else if (notif.link?.includes('profile')) {
      setCurrentTab('profile');
    } else {
      setCurrentTab('messages');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Work<span className="text-indigo-600">Nova</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  Marketplace
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentTab('jobs')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'jobs'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Find Work
              </button>
              <button
                onClick={() => setCurrentTab('talent')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'talent'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Find Talent
              </button>
              <button
                onClick={() => setCurrentTab('services')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'services'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Services
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setCurrentTab('projects')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentTab === 'projects'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Contracts
                  </button>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentTab === 'dashboard'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Post a Job button (Clients or Visitors) */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth();
                } else {
                  setCurrentTab('post-job');
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Active Mode Switcher */}
                <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                  <button
                    onClick={() => setActiveRole('worker')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeRole === 'worker'
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Freelancer Mode
                  </button>
                  <button
                    onClick={() => setActiveRole('client')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeRole === 'client'
                        ? 'bg-white text-emerald-700 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Client Mode
                  </button>
                </div>

                {/* Messages button */}
                <button
                  onClick={() => setCurrentTab('messages')}
                  title="Messages"
                  className={`p-2 rounded-lg relative transition-colors cursor-pointer ${
                    currentTab === 'messages'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                {/* Notifications button & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    title="Notifications"
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        <span className="text-xs text-slate-500">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                                !notif.read ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.body}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <img
                      src={
                        currentUser.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {currentUser.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 font-medium">
                          Active: {activeRole === 'worker' ? 'Freelancer' : 'Client'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('projects');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderGit2 className="w-4 h-4 text-slate-400" />
                        Contracts & Projects
                      </button>

                      <button
                        onClick={() => {
                          setActiveRole(activeRole === 'worker' ? 'client' : 'worker');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                        Switch to {activeRole === 'worker' ? 'Client' : 'Freelancer'}
                      </button>

                      <div className="border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            signOut();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              setCurrentTab('jobs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Find Work (Jobs)
          </button>
          <button
            onClick={() => {
              setCurrentTab('talent');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Find Talent (Freelancers)
          </button>
          <button
            onClick={() => {
              setCurrentTab('services');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Services Catalog
          </button>
          {currentUser && (
            <>
              <button
                onClick={() => {
                  setCurrentTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentTab('messages');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Messages
              </button>
              <button
                onClick={() => {
                  setCurrentTab('projects');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Contracts & Projects
              </button>
              <button
                onClick={() => {
                  setCurrentTab('profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                My Profile
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setCurrentTab('post-job');
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white text-center cursor-pointer"
          >
            + Post a Job
          </button>
        </div>
      )}
    </header>
  );
};
