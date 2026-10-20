import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FolderGit2,
  Send,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  ArrowRight,
  MessageSquare,
  Sparkles,
  TrendingUp,
  DollarSign,
  Star,
  Eye,
  SlidersHorizontal,
  Check,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getJobs,
  getApplicationsByWorker,
  getApplicationsForJob,
  getProjectsForUser,
  createProjectContract,
  updateApplicationStatus,
  acceptJobApplication,
  rejectJobApplication,
} from '../firebase/marketplaceService';
import { Job, JobApplication, ProjectContract } from '../types';
import { getOrCreateConversation } from '../firebase/chatService';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  onSelectJob: (job: Job) => void;
  onSelectWorker: (workerUid: string) => void;
  onNavigateToMessages?: (convId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAuth,
  onSelectJob,
  onSelectWorker,
  onNavigateToMessages,
}) => {
  const { currentUser, activeRole, setActiveRole, workerProfile, clientProfile } = useAuth();
  const [workerApplications, setWorkerApplications] = useState<JobApplication[]>([]);
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<string | null>(null);
  const [jobApplicants, setJobApplicants] = useState<JobApplication[]>([]);
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [rejectingApp, setRejectingApp] = useState<JobApplication | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [currentUser, activeRole]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      if (activeRole === 'worker') {
        const apps = await getApplicationsByWorker(currentUser.uid);
        setWorkerApplications(apps);
      } else {
        const allJobs = await getJobs();
        const myJobs = allJobs.filter((j) => j.clientUid === currentUser.uid);
        setClientJobs(myJobs);

        if (myJobs.length > 0) {
          const firstJobId = myJobs[0].id;
          setSelectedJobForApplicants(firstJobId);
          const applicants = await getApplicationsForJob(firstJobId);
          setJobApplicants(applicants);
        }
      }

      const projList = await getProjectsForUser(currentUser.uid);
      setProjects(projList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJobApplicants = async (jobId: string) => {
    setSelectedJobForApplicants(jobId);
    try {
      const applicants = await getApplicationsForJob(jobId);
      setJobApplicants(applicants);
    } catch (err) {
      console.error('Error fetching job applicants:', err);
    }
  };

  const handleAcceptApplicant = async (app: JobApplication) => {
    if (!currentUser) return;
    setProcessingAppId(app.id);

    try {
      const clientName = clientProfile?.companyName || clientProfile?.displayName || currentUser.displayName || 'Client';
      await acceptJobApplication(app, {
        uid: currentUser.uid,
        displayName: clientName,
        photoURL: currentUser.photoURL || undefined,
      });

      // Update state locally
      setJobApplicants((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'accepted' } : a))
      );

      // Refresh projects
      const projList = await getProjectsForUser(currentUser.uid);
      setProjects(projList);

      setToast({
        message: `🎉 Proposal accepted! Contract created and notification sent to ${app.workerName}.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to accept applicant:', err);
      setToast({
        message: err.message || 'Failed to accept application.',
        type: 'error',
      });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApplicant = async () => {
    if (!currentUser || !rejectingApp) return;
    setProcessingAppId(rejectingApp.id);

    try {
      const clientName = clientProfile?.companyName || clientProfile?.displayName || currentUser.displayName || 'Client';
      await rejectJobApplication(
        rejectingApp,
        {
          uid: currentUser.uid,
          displayName: clientName,
        },
        rejectReason.trim() || undefined
      );

      // Update state locally
      setJobApplicants((prev) =>
        prev.map((a) => (a.id === rejectingApp.id ? { ...a, status: 'rejected' } : a))
      );

      setToast({
        message: `Application from ${rejectingApp.workerName} rejected. Notification sent to worker.`,
        type: 'info',
      });
      setRejectingApp(null);
      setRejectReason('');
    } catch (err: any) {
      console.error('Failed to reject applicant:', err);
      setToast({
        message: err.message || 'Failed to reject application.',
        type: 'error',
      });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleDirectChat = async (targetUid: string, targetName: string, targetPhoto?: string) => {
    if (!currentUser) return;
    try {
      const convId = await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Client',
          photoURL: currentUser.photoURL || undefined,
          role: activeRole === 'worker' ? 'worker' : 'client',
        },
        {
          uid: targetUid,
          displayName: targetName,
          photoURL: targetPhoto,
          role: activeRole === 'worker' ? 'client' : 'worker',
        }
      );
      if (onNavigateToMessages) {
        onNavigateToMessages(convId);
      } else {
        onNavigate('messages');
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      onNavigate('messages');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to Access Your Dashboard</h2>
        <p className="text-xs text-slate-500">
          Track project applications, incoming proposals, contracts, and platform earnings.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Calculate profile completion percentage for worker
  const profilePercent = workerProfile
    ? Math.min(
        100,
        (workerProfile.headline ? 20 : 0) +
          (workerProfile.bio ? 20 : 0) +
          ((workerProfile.skills?.length || 0) > 0 ? 20 : 0) +
          ((workerProfile.portfolio?.length || 0) > 0 ? 20 : 0) +
          (workerProfile.hourlyRate ? 20 : 0)
      )
    : 40;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
            {activeRole === 'worker' ? 'Freelancer Dashboard' : 'Client Operations Center'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
            Welcome, {currentUser.displayName || 'Member'}!
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {activeRole === 'worker'
              ? 'Review submitted proposals, active contracts, and client inquiries.'
              : 'Manage job postings, review applicant proposals, and hire talent.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-white/10 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveRole('worker')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeRole === 'worker'
                  ? 'bg-white text-indigo-950 font-bold shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Freelancer
            </button>
            <button
              onClick={() => setActiveRole('client')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-white text-indigo-950 font-bold shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              Client
            </button>
          </div>

          {activeRole === 'client' && (
            <button
              onClick={() => onNavigate('post-job')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Job</span>
            </button>
          )}
        </div>
      </div>

      {/* WORKER DASHBOARD VIEW */}
      {activeRole === 'worker' && (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Proposals Sent</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{workerApplications.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Active Contracts</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Completed</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {projects.filter((p) => p.status === 'completed').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Hourly Rate</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${workerProfile?.hourlyRate || 50}/hr
              </p>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Profile Completion: {profilePercent}%</h3>
              <p className="text-xs text-slate-500">
                A completed profile receives up to 4x more direct client inquiries and interview invites.
              </p>
              <div className="w-full sm:w-80 h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${profilePercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Manage Profile
            </button>
          </div>

          {/* My Submitted Proposals */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Job Proposals</h3>
                <p className="text-xs text-slate-400">Track the status of your active applications</p>
              </div>

              <button
                onClick={() => onNavigate('jobs')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Find more jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {workerApplications.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Send className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No proposals submitted yet</p>
                <p className="text-[11px] text-slate-400">
                  Explore available jobs and submit your proposal with your bid and timeline.
                </p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Browse Open Jobs
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workerApplications.map((app) => (
                  <div key={app.id} className="py-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{app.jobTitle || 'Job Proposal'}</h4>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              app.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : app.status === 'shortlisted'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : app.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {app.status === 'accepted' ? '🎉 Accepted' : app.status === 'rejected' ? 'Declined' : 'Under Review'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Your Bid: <strong className="text-slate-800">${app.proposedPrice}</strong></span>
                          <span>•</span>
                          <span>Timeline: {app.estimatedDays} days</span>
                          <span>•</span>
                          <span>Submitted {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'accepted' ? (
                          <>
                            <button
                              onClick={() => onNavigate('projects')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Go to Contract</span>
                            </button>
                            <button
                              onClick={() => handleDirectChat(app.clientUid, 'Client')}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message Client</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDirectChat(app.clientUid, 'Client')}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Contact Client</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {app.status === 'accepted' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Congratulations!</strong> The client accepted your proposal. Work has officially commenced.
                          </span>
                        </div>
                        <button
                          onClick={() => onNavigate('projects')}
                          className="font-bold underline ml-2 shrink-0 hover:text-emerald-950 cursor-pointer"
                        >
                          View Contract & Milestones &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIENT DASHBOARD VIEW */}
      {activeRole === 'client' && (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Posted Jobs</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{clientJobs.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Active Contracts</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Completed Contracts</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {projects.filter((p) => p.status === 'completed').length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Hired Talent</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{projects.length}</p>
            </div>
          </div>

          {/* Toast / Action Feedback */}
          {toast && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Two-Column: Left Posted Jobs & Right Applicants Review */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Posted Jobs */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Your Posted Jobs</h3>
                <span className="text-xs text-slate-400 font-medium">({clientJobs.length})</span>
              </div>

              {clientJobs.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">You haven't posted any jobs yet</p>
                  <button
                    onClick={() => onNavigate('post-job')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJobApplicants(job.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedJobForApplicants === job.id
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{job.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span>
                          ${job.budgetMin} - ${job.budgetMax} ({job.budgetType})
                        </span>
                        <span className="text-indigo-600 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {job.proposalCount || 0} applicants
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Applicants for Selected Job */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Proposals</h3>
                  <p className="text-xs text-slate-400">
                    Accept or reject proposals from applicants. When accepted, a contract is started and the worker is notified!
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {jobApplicants.length} applicants
                </span>
              </div>

              {jobApplicants.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="font-medium text-slate-600">No proposals submitted for this job yet</p>
                  <p className="text-[11px] text-slate-400">
                    Freelancers will apply through the job marketplace. Once they apply, you can Accept or Reject them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobApplicants.map((app) => (
                    <div
                      key={app.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        app.status === 'accepted'
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : app.status === 'rejected'
                          ? 'border-slate-200 bg-slate-50/40 opacity-75'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => onSelectWorker(app.workerUid)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={
                              app.workerPhoto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={app.workerName}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-2xs"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {app.workerName}
                            </h4>
                            <p className="text-xs text-slate-500">{app.workerHeadline || 'Freelancer'}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 block">
                            ${app.proposedPrice}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" /> in {app.estimatedDays} days
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cover Letter:</span>
                        "{app.coverLetter}"
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-200/60 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                              app.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : app.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {app.status === 'accepted' ? '✓ Accepted & Hired' : app.status === 'rejected' ? '✕ Declined' : 'Pending Review'}
                          </span>

                          <button
                            onClick={() => handleDirectChat(app.workerUid, app.workerName, app.workerPhoto)}
                            className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </div>

                        {/* Accept or Reject Action Options */}
                        <div className="flex items-center gap-2">
                          {app.status === 'accepted' ? (
                            <button
                              onClick={() => onNavigate('projects')}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Contract</span>
                            </button>
                          ) : (
                            <>
                              {/* Accept Button */}
                              <button
                                disabled={processingAppId === app.id}
                                onClick={() => handleAcceptApplicant(app)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{processingAppId === app.id ? 'Accepting...' : 'Accept & Start'}</span>
                              </button>

                              {/* Reject Button */}
                              {app.status !== 'rejected' && (
                                <button
                                  disabled={processingAppId === app.id}
                                  onClick={() => setRejectingApp(app)}
                                  className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Decline Proposal</h3>
              <button
                onClick={() => {
                  setRejectingApp(null);
                  setRejectReason('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to decline the proposal from{' '}
              <strong className="text-slate-900">{rejectingApp.workerName}</strong> for{' '}
              <strong className="text-slate-900">${rejectingApp.proposedPrice}</strong>? The freelancer will be notified.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Feedback / Reason:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Over budget, chose candidate with specialized framework experience, etc."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setRejectingApp(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={processingAppId === rejectingApp.id}
                onClick={handleRejectApplicant}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {processingAppId === rejectingApp.id ? 'Declining...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
