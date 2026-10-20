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
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data/categories';
import { getJobs } from '../firebase/marketplaceService';
import { Job } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../firebase/chatService';

interface JobsPageProps {
  initialSearch?: string;
  initialCategory?: string;
  onOpenApplyModal: (job: Job) => void;
  onOpenAuth: () => void;
  onNavigateToMessages: () => void;
  selectedJobProp?: Job | null;
}

export const JobsPage: React.FC<JobsPageProps> = ({
  initialSearch = '',
  initialCategory = 'All',
  onOpenApplyModal,
  onOpenAuth,
  onNavigateToMessages,
  selectedJobProp,
}) => {
  const { currentUser, workerProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [budgetType, setBudgetType] = useState<'all' | 'fixed' | 'hourly'>('all');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  const [activeJob, setActiveJob] = useState<Job | null>(selectedJobProp || null);

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
      await getOrCreateConversation(
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
      onNavigateToMessages();
    } catch (err) {
      console.error('Failed to open chat with client:', err);
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

              {/* Action Buttons */}
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
    </div>
  );
};
