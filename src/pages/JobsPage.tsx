import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  Briefcase,
  ArrowRight,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  X,
  Check,
  AlertCircle,
  Users,
  ExternalLink,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data/categories';
import {
  getJobs,
  getApplicationsForJob,
  getApplicationsByWorker,
  acceptJobApplication,
  rejectJobApplication,
} from '../firebase/marketplaceService';
import { Job, JobApplication } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../firebase/chatService';

interface JobsPageProps {
  initialSearch?: string;
  initialCategory?: string;
  onOpenApplyModal: (job: Job) => void;
  onOpenAuth: () => void;
  onNavigateToMessages: (convId?: string) => void;
  onNavigate?: (tab: string) => void;
  selectedJobProp?: Job | null;
}

export const JobsPage: React.FC<JobsPageProps> = ({
  initialSearch = '',
  initialCategory = 'All',
  onOpenApplyModal,
  onOpenAuth,
  onNavigateToMessages,
  onNavigate,
  selectedJobProp,
}) => {
  const { currentUser, clientProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [budgetType, setBudgetType] = useState<'all' | 'fixed' | 'hourly'>('all');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  const [activeJob, setActiveJob] = useState<Job | null>(selectedJobProp || null);

  // Applicants & Proposal States
  const [jobApplicants, setJobApplicants] = useState<JobApplication[]>([]);
  const [myApplication, setMyApplication] = useState<JobApplication | null>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [rejectingApp, setRejectingApp] = useState<JobApplication | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Load applicants or user's application when active job changes
  useEffect(() => {
    if (!activeJob) {
      setJobApplicants([]);
      setMyApplication(null);
      return;
    }

    if (currentUser) {
      // If current user is the job author (client)
      if (activeJob.clientUid === currentUser.uid) {
        setLoadingApplicants(true);
        getApplicationsForJob(activeJob.id)
          .then((apps) => {
            setJobApplicants(apps);
          })
          .catch((err) => console.error('Failed to load job applicants:', err))
          .finally(() => setLoadingApplicants(false));
      } else {
        // Current user is a potential worker, check if already applied
        getApplicationsByWorker(currentUser.uid)
          .then((myApps) => {
            const found = myApps.find((a) => a.jobId === activeJob.id);
            setMyApplication(found || null);
          })
          .catch((err) => console.error('Failed to check worker application:', err));
      }
    } else {
      setJobApplicants([]);
      setMyApplication(null);
    }
  }, [activeJob, currentUser]);

  useEffect(() => {
    loadJobs();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedJobProp) {
      setActiveJob(selectedJobProp);
    }
  }, [selectedJobProp]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getJobs(selectedCategory === 'All' ? undefined : selectedCategory, searchTerm);
      setJobs(data);
      if (data.length > 0 && !activeJob) {
        setActiveJob(data[0]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const filteredJobs = jobs.filter((job) => {
    if (budgetType !== 'all' && job.budgetType !== budgetType) return false;
    if (experienceLevel !== 'all' && job.experienceLevel !== experienceLevel) return false;
    return true;
  });

  const handleMessageClient = async (job: Job) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      const convId = await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Freelancer',
          photoURL: currentUser.photoURL || undefined,
          role: 'worker',
        },
        {
          uid: job.clientUid,
          displayName: job.clientName,
          photoURL: job.clientPhoto,
          role: 'client',
        },
        { id: job.id, title: job.title }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Failed to open chat with client:', err);
    }
  };

  const handleMessageWorker = async (app: JobApplication) => {
    if (!currentUser) return;
    try {
      const convId = await getOrCreateConversation(
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
        { id: app.jobId, title: app.jobTitle || 'Job Discussion' }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Failed to chat with worker:', err);
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

      // Update local state
      setJobApplicants((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'accepted' } : a))
      );

      setFeedbackToast({
        message: `🎉 Proposal accepted! Contract created and notification sent to ${app.workerName}.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to accept applicant:', err);
      setFeedbackToast({
        message: err.message || 'Failed to accept proposal.',
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

      // Update local state
      setJobApplicants((prev) =>
        prev.map((a) => (a.id === rejectingApp.id ? { ...a, status: 'rejected' } : a))
      );

      setFeedbackToast({
        message: `Proposal from ${rejectingApp.workerName} rejected. Worker has been notified.`,
        type: 'info',
      });
      setRejectingApp(null);
      setRejectReason('');
    } catch (err: any) {
      console.error('Failed to reject applicant:', err);
      setFeedbackToast({
        message: err.message || 'Failed to reject proposal.',
        type: 'error',
      });
    } finally {
      setProcessingAppId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Job Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Apply to verified projects from global clients. Real contracts, milestones, and direct client chat.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, titles, or required skills (e.g. React, Python, Video Editing)..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Filter
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Budget Type */}
          <select
            value={budgetType}
            onChange={(e) => setBudgetType(e.target.value as any)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Budget Type</option>
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly Rate</option>
          </select>

          {/* Experience */}
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Experience</option>
            <option value="entry">Entry Level</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Job List & Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
            <span>{filteredJobs.length} Jobs Available</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading available jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No jobs match your search</p>
              <p className="text-xs text-slate-500">Try broadening your category or keyword filters.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setActiveJob(job)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeJob?.id === job.id
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {job.category}
                  </span>
                  <span className="text-xs font-bold text-slate-900 shrink-0">
                    ${job.budgetMin} - ${job.budgetMax}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                      ({job.budgetType})
                    </span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2">
                  {job.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {job.skills?.slice(0, 3).map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{job.deliveryTime || 'Flexible delivery'}</span>
                  <span className="text-indigo-600 font-semibold">
                    {job.proposalCount || 0} proposals
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-7">
          {activeJob ? (
            <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {activeJob.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Posted on {new Date(activeJob.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {activeJob.title}
                </h2>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      Estimated Budget
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      ${activeJob.budgetMin} - ${activeJob.budgetMax}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">
                      ({activeJob.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      Proposals
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {activeJob.proposalCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toast Notification */}
              {feedbackToast && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
                    feedbackToast.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : feedbackToast.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedbackToast.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : feedbackToast.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="font-medium">{feedbackToast.message}</span>
                  </div>
                  <button
                    onClick={() => setFeedbackToast(null)}
                    className="text-slate-400 hover:text-slate-600 ml-3 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* CLIENT VIEW: Own Job Posting Management & Proposals */}
              {currentUser && activeJob.clientUid === currentUser.uid ? (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        👑 You posted this job
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                      {jobApplicants.length} Applicants
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Review proposals from freelancers. You have <strong>Accept</strong> and <strong>Reject</strong> options. When you accept, a contract is started and the worker receives an immediate notification!
                  </p>

                  {/* Applicants List */}
                  {loadingApplicants ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading applicant proposals...</div>
                  ) : jobApplicants.length === 0 ? (
                    <div className="py-8 text-center bg-white rounded-xl border border-dashed border-indigo-200 text-xs text-slate-500 space-y-1">
                      <Users className="w-6 h-6 text-indigo-300 mx-auto mb-1" />
                      <p className="font-semibold text-slate-700">No applicants yet</p>
                      <p className="text-[11px] text-slate-400">When freelancers apply, they will appear here with Accept and Reject buttons.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobApplicants.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                            app.status === 'accepted'
                              ? 'bg-emerald-50/80 border-emerald-300'
                              : app.status === 'rejected'
                              ? 'bg-slate-100/70 border-slate-200 opacity-75'
                              : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  app.workerPhoto ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                                }
                                alt={app.workerName}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                              />
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{app.workerName}</h4>
                                <p className="text-[11px] text-slate-500">{app.workerHeadline || 'Freelancer'}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-black text-slate-900">${app.proposedPrice}</span>
                              <span className="text-[10px] text-slate-500 block">in {app.estimatedDays} days</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Proposal:</span>
                            "{app.coverLetter}"
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  app.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : app.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {app.status === 'accepted' ? '✓ Accepted' : app.status === 'rejected' ? '✕ Declined' : 'Pending'}
                              </span>

                              <button
                                onClick={() => handleMessageWorker(app)}
                                className="text-slate-600 hover:text-indigo-600 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {app.status === 'accepted' ? (
                                <button
                                  onClick={() => onNavigate && onNavigate('projects')}
                                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>View Contract</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    disabled={processingAppId === app.id}
                                    onClick={() => handleAcceptApplicant(app)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{processingAppId === app.id ? 'Accepting...' : 'Accept'}</span>
                                  </button>

                                  {app.status !== 'rejected' && (
                                    <button
                                      disabled={processingAppId === app.id}
                                      onClick={() => setRejectingApp(app)}
                                      className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
              ) : (
                /* WORKER / GUEST VIEW */
                <div className="space-y-3">
                  {myApplication ? (
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        myApplication.status === 'accepted'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : myApplication.status === 'rejected'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {myApplication.status === 'accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs uppercase tracking-wider">
                            {myApplication.status === 'accepted'
                              ? '🎉 Proposal Accepted!'
                              : myApplication.status === 'rejected'
                              ? 'Proposal Declined'
                              : '✓ Proposal Submitted'}
                          </span>
                        </div>
                        <span className="text-xs font-bold">${myApplication.proposedPrice}</span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {myApplication.status === 'accepted'
                          ? 'The client accepted your application! The contract has officially begun.'
                          : myApplication.status === 'rejected'
                          ? 'Your proposal was reviewed and not accepted for this job.'
                          : 'Your proposal is currently under review by the client.'}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        {myApplication.status === 'accepted' && (
                          <button
                            onClick={() => onNavigate && onNavigate('projects')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Contract</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleMessageClient(activeJob)}
                          className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message Client</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (!currentUser) onOpenAuth();
                          else onOpenApplyModal(activeJob);
                        }}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>Apply Now</span>
                      </button>

                      <button
                        onClick={() => handleMessageClient(activeJob)}
                        className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        <span>Message Client</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Project Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {activeJob.description}
                </p>
              </div>

              {/* Required Skills */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Required Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeJob.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <img
                  src={
                    activeJob.clientPhoto ||
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={activeJob.clientName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{activeJob.clientName}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Payment & Identity Verified
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Select a job to view complete requirements and apply.
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
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
              <strong className="text-slate-900">${rejectingApp.proposedPrice}</strong>? The freelancer will receive a notification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Reason / Feedback:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Timeline mismatch, candidate with different skill selected, etc."
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
