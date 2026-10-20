import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  MessageSquare,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { getAllWorkers } from '../firebase/marketplaceService';
import { WorkerProfile } from '../types';
import { SERVICE_CATEGORIES } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../firebase/chatService';

interface TalentPageProps {
  onSelectWorker: (workerUid: string) => void;
  onOpenAuth: () => void;
  onNavigateToMessages: (convId?: string) => void;
}

export const TalentPage: React.FC<TalentPageProps> = ({
  onSelectWorker,
  onOpenAuth,
  onNavigateToMessages,
}) => {
  const { currentUser } = useAuth();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'reviews'>('rating');
  const [experienceLevel, setExperienceLevel] = useState('all');

  useEffect(() => {
    loadWorkers();
  }, [selectedCategory]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkers(selectedCategory === 'All' ? undefined : selectedCategory, searchTerm);
      setWorkers(data);
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkers();
  };

  const sortedWorkers = [...workers]
    .filter((w) => {
      if (experienceLevel !== 'all' && w.experienceLevel !== experienceLevel) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price_low') return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      if (sortBy === 'price_high') return (b.hourlyRate || 0) - (a.hourlyRate || 0);
      if (sortBy === 'reviews') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return 0;
    });

  const handleMessageWorker = async (worker: WorkerProfile) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      const convId = await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Client',
          photoURL: currentUser.photoURL || undefined,
          role: 'client',
        },
        {
          uid: worker.uid,
          displayName: worker.displayName,
          photoURL: worker.photoURL,
          role: 'worker',
        }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Failed to open chat with worker:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Vetted Freelancers & Specialists
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Connect directly with top developers, video editors, AI specialists, designers, and marketers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search talent by name, skills, title (e.g. Next.js, Motion Graphics, Python)..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="rating">Highest Rated</option>
            <option value="price_low">Lowest Hourly Rate</option>
            <option value="price_high">Highest Hourly Rate</option>
            <option value="reviews">Most Reviewed</option>
          </select>

          {/* Experience */}
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">Any Experience Level</option>
            <option value="entry">Entry Level</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>

          <span className="text-slate-400 ml-auto font-medium">
            {sortedWorkers.length} talent profiles found
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading talent directory...
        </div>
      ) : sortedWorkers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No freelancers match your criteria</p>
          <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWorkers.map((worker) => (
            <div
              key={worker.uid}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-slate-800 to-indigo-900 relative">
                  {worker.coverURL && (
                    <img
                      src={worker.coverURL}
                      alt="Cover"
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                </div>

                <div className="p-5 pt-0 relative">
                  {/* Photo & Rating */}
                  <div className="-mt-10 mb-3 flex items-end justify-between">
                    <img
                      src={
                        worker.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={worker.displayName}
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                    />

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{worker.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-amber-600 font-normal">({worker.reviewCount || 0})</span>
                    </div>
                  </div>

                  {/* Title & Info */}
                  <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors">
                    {worker.displayName}
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">{worker.headline}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {worker.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {worker.availability === 'full_time'
                        ? 'Full Time'
                        : worker.availability === 'part_time'
                        ? 'Part Time'
                        : 'Available'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {worker.bio}
                  </p>

                  {/* Skills */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {worker.skills?.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {(worker.skills?.length || 0) > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium self-center">
                        +{(worker.skills?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rate</span>
                  <span className="text-base font-extrabold text-slate-900">${worker.hourlyRate}/hr</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMessageWorker(worker)}
                    title="Send direct message"
                    className="p-2 border border-slate-300 hover:bg-white text-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectWorker(worker.uid)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
