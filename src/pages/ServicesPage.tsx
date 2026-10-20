import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Star,
  Clock,
  RotateCcw,
  Check,
  MessageSquare,
  Sparkles,
  DollarSign,
  X,
} from 'lucide-react';
import { getServices, createServiceListing } from '../firebase/marketplaceService';
import { ServiceListing } from '../types';
import { SERVICE_CATEGORIES } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../firebase/chatService';

interface ServicesPageProps {
  onOpenAuth: () => void;
  onNavigateToMessages: (convId?: string) => void;
  onSelectWorker: (workerUid: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onOpenAuth,
  onNavigateToMessages,
  onSelectWorker,
}) => {
  const { currentUser, workerProfile, activeRole } = useAuth();
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].name);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
  );
  const [startingPrice, setStartingPrice] = useState(150);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [revisions, setRevisions] = useState(2);
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>(['React Development', 'UI/UX Design']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices(selectedCategory === 'All' ? undefined : selectedCategory, searchTerm);
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    try {
      await createServiceListing({
        workerUid: currentUser.uid,
        workerName: workerProfile?.displayName || currentUser.displayName || 'Freelancer',
        workerPhoto: workerProfile?.photoURL || currentUser.photoURL || undefined,
        title: title.trim(),
        category,
        description: description.trim(),
        coverImage,
        startingPrice: Number(startingPrice),
        deliveryDays: Number(deliveryDays),
        revisions: Number(revisions),
        skills: skillsList,
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      loadServices();
    } catch (err) {
      console.error('Failed to create service listing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactWorker = async (service: ServiceListing) => {
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
          uid: service.workerUid,
          displayName: service.workerName,
          photoURL: service.workerPhoto,
          role: 'worker',
        },
        { id: service.id, title: service.title }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Error opening conversation:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Freelance Services & Gigs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse clear, fixed-price packages delivered by vetted professionals.
          </p>
        </div>

        {currentUser && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>List a Service</span>
          </button>
        )}
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat.name
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading service packages...
        </div>
      ) : services.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No service packages in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first freelancer to list an offering here and attract hiring clients!
          </p>
          {currentUser && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Create Service Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Cover Image */}
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                  <img
                    src={service.coverImage}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 shadow-xs">
                    {service.category}
                  </span>
                </div>

                <div className="p-5">
                  {/* Worker Details */}
                  <div
                    onClick={() => onSelectWorker(service.workerUid)}
                    className="flex items-center gap-2 mb-3 cursor-pointer group/user"
                  >
                    <img
                      src={
                        service.workerPhoto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={service.workerName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <span className="text-xs font-bold text-slate-800 group-hover/user:text-indigo-600 transition-colors">
                      {service.workerName}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{service.rating}</span>
                      <span className="text-slate-400 font-normal">({service.reviewCount})</span>
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {service.deliveryDays} Days
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                      {service.revisions} Revisions
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Price</span>
                  <span className="text-base font-black text-slate-900">${service.startingPrice}</span>
                </div>

                <button
                  onClick={() => handleContactWorker(service)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Order / Inquire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Service Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  Freelancer Marketplace
                </span>
                <h3 className="text-lg font-bold">Publish a New Service Package</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Title (e.g. "I will...")
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="I will develop a responsive Next.js web application"
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Starting Price ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Days
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Revisions Included
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={revisions}
                    onChange={(e) => setRevisions(Number(e.target.value))}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description & Deliverables
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail what is included, your tech stack, deliverable formats, and requirements from the client..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
