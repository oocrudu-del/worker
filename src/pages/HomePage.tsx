import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Star,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  ChevronRight,
  Code,
  Video,
  Sparkles,
  Palette,
  Smartphone,
  BookOpen,
  DollarSign,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data/categories';
import { getJobs, getAllWorkers, getServices } from '../firebase/marketplaceService';
import { Job, WorkerProfile, ServiceListing } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onNavigate: (tab: string, filter?: string) => void;
  onSelectWorker: (workerUid: string) => void;
  onSelectJob: (job: Job) => void;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectWorker,
  onSelectJob,
  onOpenAuth,
}) => {
  const { currentUser, setActiveRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredWorkers, setFeaturedWorkers] = useState<WorkerProfile[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [featuredServices, setFeaturedServices] = useState<ServiceListing[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getAllWorkers().then((data) => setFeaturedWorkers(data.slice(0, 4)));
    getJobs().then((data) => setLatestJobs(data.slice(0, 4)));
    getServices().then((data) => setFeaturedServices(data.slice(0, 3)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onNavigate('jobs', searchTerm.trim());
    }
  };

  const faqs = [
    {
      q: 'How does WorkNova protect clients and freelancers?',
      a: 'WorkNova ensures every project has clear milestones and deadlines. Contracts maintain agreed pricing and scope, with verified reviews posted exclusively upon contract completion.',
    },
    {
      q: 'How does the internal messaging system work?',
      a: 'WorkNova includes a real-time Messenger-style chat where you can exchange instant messages, photos, videos, briefs, and code attachments without sharing personal details until you choose to.',
    },
    {
      q: 'Can I be both a client and a freelancer on WorkNova?',
      a: 'Yes! WorkNova lets you seamlessly toggle between Freelancer and Client modes from your header or profile without needing separate logins.',
    },
    {
      q: 'How do workers receive proposals and jobs?',
      a: 'Clients can either post open jobs for workers to submit competitive proposals, or discover freelancers directly via their portfolios and book their pre-packaged services.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900/10 via-slate-50 to-white pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Talent Ecosystem for Modern Teams</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Find the Right Talent.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                Get Your Work Done.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect with vetted software engineers, video editors, AI specialists, and creative professionals. Real-time contracts, integrated messaging, and guaranteed delivery.
            </p>

            {/* Prominent Dual Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  setActiveRole('client');
                  onNavigate('talent');
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Find a Freelancer</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveRole('worker');
                  onNavigate('jobs');
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Find Work</span>
                <Briefcase className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-4">
              <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Try 'React Developer', 'YouTube Video Editor', 'AI Chatbot', 'Logo Design'..."
                  className="w-full pl-12 pr-28 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Metrics Counter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-200 max-w-4xl mx-auto">
              <div>
                <p className="text-2xl font-black text-slate-900">12,400+</p>
                <p className="text-xs text-slate-500 font-medium">Vetted Freelancers</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">8,900+</p>
                <p className="text-xs text-slate-500 font-medium">Completed Projects</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">4.92 / 5.0</p>
                <p className="text-xs text-slate-500 font-medium">Average Review</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">0%</p>
                <p className="text-xs text-slate-500 font-medium">Hidden Fees</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Browse by Specialty</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Explore Top Service Categories
            </h2>
          </div>
          <button
            onClick={() => onNavigate('talent')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View all talent categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_CATEGORIES.map((cat) => {
            const getIcon = () => {
              switch (cat.icon) {
                case 'Video':
                  return <Video className="w-5 h-5 text-rose-500" />;
                case 'Code':
                  return <Code className="w-5 h-5 text-indigo-500" />;
                case 'Sparkles':
                  return <Sparkles className="w-5 h-5 text-amber-500" />;
                case 'Palette':
                  return <Palette className="w-5 h-5 text-purple-500" />;
                case 'Smartphone':
                  return <Smartphone className="w-5 h-5 text-blue-500" />;
                case 'BookOpen':
                  return <BookOpen className="w-5 h-5 text-emerald-500" />;
                case 'TrendingUp':
                  return <TrendingUp className="w-5 h-5 text-cyan-500" />;
                default:
                  return <Briefcase className="w-5 h-5 text-slate-500" />;
              }
            };

            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('jobs', cat.name)}
                className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-100 flex items-center justify-center mb-3 transition-colors">
                    {getIcon()}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cat.popularSkills.length} Core Skills</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Top-Tier Professionals</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Hire World-Class Freelancers
            </h2>
          </div>
          <button
            onClick={() => onNavigate('talent')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all freelancers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredWorkers.map((worker) => (
            <div
              key={worker.uid}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Cover Banner */}
                <div className="h-20 bg-slate-100 relative overflow-hidden">
                  <img
                    src={
                      worker.coverURL ||
                      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'
                    }
                    alt="cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="px-5 pt-0 pb-4 relative">
                  {/* Avatar */}
                  <div className="-mt-8 mb-3 flex items-end justify-between">
                    <img
                      src={
                        worker.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={worker.displayName}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-sm"
                    />
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-800 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{worker.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                    {worker.displayName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{worker.headline}</p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {worker.bio}
                  </p>

                  {/* Skills Chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {worker.skills?.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {(worker.skills?.length || 0) > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{(worker.skills?.length || 0) - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Rate</span>
                  <span className="text-sm font-bold text-slate-900">${worker.hourlyRate}/hr</span>
                </div>
                <button
                  onClick={() => onSelectWorker(worker.uid)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Open Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Opportunities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Latest Project Listings
            </h2>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Browse all jobs</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {job.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2 hover:text-emerald-700 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      ${job.budgetMin} - ${job.budgetMax}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      {job.budgetType}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.skills?.slice(0, 4).map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {job.deliveryTime || 'Flexible delivery'}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {job.proposalCount || 0} proposals submitted
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Service Gigs (Fiverr-style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Ready-Made Packages</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Popular Pre-Packaged Services
            </h2>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all services</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onNavigate('services')}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-slate-100 overflow-hidden relative">
                  <img
                    src={service.coverImage}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800">
                    {service.category}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={service.workerPhoto}
                      alt={service.workerName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold text-slate-700">{service.workerName}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {service.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{service.rating}</span>
                    <span className="text-slate-400 font-normal">({service.reviewCount})</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <span className="text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  {service.deliveryDays} days delivery
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Starting at</span>
                  <p className="text-sm font-extrabold text-slate-900">${service.startingPrice}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Simple & Transparent</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">How WorkNova Operates</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From contract agreement to final deliverable review, your workflow is seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-sm flex items-center justify-center mb-4">
                01
              </span>
              <h4 className="font-bold text-sm text-white">Post or Browse</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Clients post detailed job requirements or browse pre-made service packages with fixed prices.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-black text-sm flex items-center justify-center mb-4">
                02
              </span>
              <h4 className="font-bold text-sm text-white">Review & Chat</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Evaluate applicant portfolios and talk in real-time with file and video sharing.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mb-4">
                03
              </span>
              <h4 className="font-bold text-sm text-white">Manage Contract</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Track deliverables, request revisions, and approve milestones in the Contracts dashboard.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-black text-sm flex items-center justify-center mb-4">
                04
              </span>
              <h4 className="font-bold text-sm text-white">Review & Rate</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Leave authentic star feedback upon completion, boosting trusted reputation on the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Frequently Asked</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Questions & Answers</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
