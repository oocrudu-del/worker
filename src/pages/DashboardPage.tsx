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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getJobs,
  getApplicationsByWorker,
  getApplicationsForJob,
  getProjectsForUser,
  createProjectContract,
  updateApplicationStatus,
} from '../firebase/marketplaceService';
import { Job, JobApplication, ProjectContract } from '../types';
import { getOrCreateConversation } from '../firebase/chatService';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  onSelectJob: (job: Job) => void;
  onSelectWorker: (workerUid: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAuth,
  onSelectJob,
  onSelectWorker,
}) => {
  const { currentUser, activeRole, setActiveRole, workerProfile, clientProfile } = useAuth();
  const [workerApplications, setWorkerApplications] = useState<JobApplication[]>([]);
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<string | null>(null);
  const [jobApplicants, setJobApplicants] = useState<JobApplication[]>([]);
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleHireApplicant = async (app: JobApplication) => {
    if (!currentUser) return;

    try {
      // 1. Mark application as accepted
      await updateApplicationStatus(app.id, 'accepted', app.workerUid, app.jobTitle);

      // 2. Create project contract
      await createProjectContract({
        title: app.jobTitle || 'Freelance Project Contract',
        jobId: app.jobId,
        clientUid: currentUser.uid,
        clientName: clientProfile?.companyName || clientProfile?.displayName || currentUser.displayName || 'Client',
        workerUid: app.workerUid,
        workerName: app.workerName,
        agreedPrice: app.proposedPrice,
      });

      // 3. Open or trigger conversation
      await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Client',
          photoURL: currentUser.photoURL || undefined,
          role: 'client',
        },
        {
          uid: app.workerUid,
          displayName: app.workerName,
          photoURL: app.workerPhoto,
          role: 'worker',
        },
        { id: app.jobId, title: app.jobTitle || 'Contract' }
      );

      // Refresh applicants list
      if (selectedJobForApplicants) {
        handleSelectJobApplicants(selectedJobForApplicants);
      }
      onNavigate('projects');
    } catch (err) {
      console.error('Failed to hire applicant:', err);
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
                  <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{app.jobTitle || 'Job Proposal'}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Bid: ${app.proposedPrice}</span>
                        <span>Delivery: {app.estimatedDays} days</span>
                        <span>Submitted {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          app.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : app.status === 'shortlisted'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
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
                        <span className="text-indigo-600 font-semibold">
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
                <h3 className="text-base font-bold text-slate-900">Review Proposals</h3>
                <span className="text-xs text-slate-400">
                  {jobApplicants.length} applicants for selected job
                </span>
              </div>

              {jobApplicants.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No proposals submitted for this job yet. Freelancers can apply through the job marketplace.
                </div>
              ) : (
                <div className="space-y-4">
                  {jobApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
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
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {app.workerName}
                            </h4>
                            <p className="text-[11px] text-slate-500">{app.workerHeadline}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 block">
                            ${app.proposedPrice}
                          </span>
                          <span className="text-[10px] text-slate-400">in {app.estimatedDays} days</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                        "{app.coverLetter}"
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            app.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>

                        <div className="flex items-center gap-2">
                          {app.status !== 'accepted' && (
                            <button
                              onClick={() => handleHireApplicant(app)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Hire & Start Contract
                            </button>
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
    </div>
  );
};
