import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  Clock,
  Globe,
  MessageSquare,
  Edit3,
  Plus,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Share2,
  Calendar,
  Save,
  X,
  Phone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkerProfile, getReviewsForUser } from '../firebase/marketplaceService';
import { WorkerProfile, Review, PortfolioItem, SocialLinks } from '../types';
import { SERVICE_CATEGORIES, ALL_SKILLS } from '../data/categories';
import { getOrCreateConversation } from '../firebase/chatService';

interface WorkerProfilePageProps {
  workerUid?: string;
  onNavigateToMessages: (convId?: string) => void;
  onOpenAuth: () => void;
}

export const WorkerProfilePage: React.FC<WorkerProfilePageProps> = ({
  workerUid,
  onNavigateToMessages,
  onOpenAuth,
}) => {
  const { currentUser, workerProfile: myWorkerProfile, updateWorkerProfileData } = useAuth();
  const isMyProfile = !workerUid || (currentUser && workerUid === currentUser.uid);

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);

  // Edit form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(50);
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'intermediate' | 'expert'>('expert');
  const [availability, setAvailability] = useState<'full_time' | 'part_time' | 'not_available'>('full_time');
  const [location, setLocation] = useState('Remote');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Portfolio add form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImg, setPImg] = useState('');
  const [pUrl, setPUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, [workerUid, myWorkerProfile]);

  const loadProfile = async () => {
    setLoading(true);
    const targetUid = workerUid || currentUser?.uid;
    if (!targetUid) {
      setLoading(false);
      return;
    }

    try {
      if (isMyProfile && myWorkerProfile) {
        setProfile(myWorkerProfile);
        syncForm(myWorkerProfile);
      } else {
        const fetched = await getWorkerProfile(targetUid);
        setProfile(fetched);
        if (fetched) syncForm(fetched);
      }

      const revs = await getReviewsForUser(targetUid);
      setReviews(revs);
    } catch (err) {
      console.error('Error loading worker profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncForm = (p: WorkerProfile) => {
    setHeadline(p.headline || '');
    setBio(p.bio || '');
    setHourlyRate(p.hourlyRate || 50);
    setExperienceLevel(p.experienceLevel || 'expert');
    setAvailability(p.availability || 'full_time');
    setLocation(p.location || 'Remote');
    setSelectedCategories(p.categories || []);
    setSelectedSkills(p.skills || []);
    setSocialLinks(p.socialLinks || {});
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const updated: Partial<WorkerProfile> = {
        headline,
        bio,
        hourlyRate: Number(hourlyRate),
        experienceLevel,
        availability,
        location,
        categories: selectedCategories,
        skills: selectedSkills,
        socialLinks,
      };

      await updateWorkerProfileData(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const newItem: PortfolioItem = {
      id: `p_${Date.now()}`,
      title: pTitle.trim(),
      description: pDesc.trim(),
      imageUrl: pImg.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      projectUrl: pUrl.trim() || undefined,
      skills: selectedSkills.slice(0, 3),
    };

    const currentPortfolio = profile.portfolio || [];
    const updatedList = [...currentPortfolio, newItem];

    await updateWorkerProfileData({ portfolio: updatedList });
    setProfile((prev) => (prev ? { ...prev, portfolio: updatedList } : null));
    setIsAddingPortfolio(false);
    setPTitle('');
    setPDesc('');
    setPImg('');
    setPUrl('');
  };

  const handleMessage = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!profile) return;

    try {
      const convId = await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Client',
          photoURL: currentUser.photoURL || undefined,
          role: 'client',
        },
        {
          uid: profile.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: 'worker',
        }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Failed to open message conversation:', err);
    }
  };

  // WhatsApp click-to-chat encoded URL
  const formatWhatsappUrl = (phone?: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      'Hello! I found your profile on WorkNova and would like to discuss a project.'
    )}`;
  };

  if (loading) {
    return <div className="p-20 text-center text-xs text-slate-400">Loading worker profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          This user has not completed their freelancer profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative">
          {profile.coverURL && (
            <img src={profile.coverURL} alt="cover" className="w-full h-full object-cover opacity-50" />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            <div className="flex items-end gap-4">
              <img
                src={
                  profile.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                }
                alt={profile.displayName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white shadow-lg bg-white shrink-0"
              />
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.displayName}
                  </h1>
                  <span className="p-1 rounded-full bg-indigo-50 text-indigo-600" title="Verified Pro">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-indigo-600 mt-0.5">{profile.headline}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isMyProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
                </button>
              ) : (
                <button
                  onClick={handleMessage}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Freelancer</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-meta details bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hourly Rate</span>
              <span className="text-base font-extrabold text-slate-900">${profile.hourlyRate}/hr</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
              <span className="text-base font-extrabold text-amber-500 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {profile.rating?.toFixed(1) || '5.0'}
                <span className="text-xs text-slate-400 font-normal">({profile.reviewCount || 0} reviews)</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Availability</span>
              <span className="text-sm font-bold text-slate-800 capitalize">
                {profile.availability === 'full_time' ? 'Full Time (40h/wk)' : 'Part Time (20h/wk)'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile.location || 'Remote'}
              </span>
            </div>
          </div>

          {/* Verified Social & Direct Contact Links */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px] mr-2">Contact Links:</span>

              {/* WhatsApp Click-to-chat */}
              {profile.socialLinks.whatsapp && profile.socialLinks.showWhatsappPublic && (
                <a
                  href={formatWhatsappUrl(profile.socialLinks.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}

              {profile.socialLinks.github && (
                <a
                  href={profile.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> GitHub
                </a>
              )}

              {profile.socialLinks.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}

              {profile.socialLinks.website && (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Form (When Active) */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-indigo-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Edit Your Freelancer Profile</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate ($/hr)</label>
              <input
                type="number"
                min={5}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">About & Biography</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Social Links Setup */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Social & Direct Contact Info (Section 5)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  WhatsApp Number (+1...)
                </label>
                <input
                  type="text"
                  placeholder="+15125550198"
                  value={socialLinks.whatsapp || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialLinks.showWhatsappPublic || false}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, showWhatsappPublic: e.target.checked })
                    }
                    className="rounded-sm text-indigo-600"
                  />
                  <span>Show WhatsApp button publicly</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={socialLinks.linkedin || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={socialLinks.github || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Personal Website</label>
                <input
                  type="url"
                  placeholder="https://myportfolio.com"
                  value={socialLinks.website || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Left Bio & Portfolio, Right Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">About</h3>
            <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {profile.bio}
            </p>

            {/* Skills */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Skills & Technologies</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills?.map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Portfolio & Past Projects</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real work samples and client projects</p>
              </div>

              {isMyProfile && (
                <button
                  onClick={() => setIsAddingPortfolio(true)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {/* Add Portfolio Modal/Drawer */}
            {isAddingPortfolio && (
              <form onSubmit={handleAddPortfolio} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Add New Portfolio Item</h4>
                <input
                  type="text"
                  required
                  placeholder="Project Title"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Short description of what was built and results achieved..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={pImg}
                    onChange={(e) => setPImg(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="url"
                    placeholder="Live Project URL (optional)"
                    value={pUrl}
                    onChange={(e) => setPUrl(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPortfolio(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            )}

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(profile.portfolio || []).length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  No portfolio projects added yet.
                </div>
              ) : (
                profile.portfolio?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50 hover:shadow-md transition-all group"
                  >
                    {item.imageUrl && (
                      <div className="h-40 overflow-hidden bg-slate-200">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Client Reviews */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Client Reviews</h3>
              <span className="text-xs text-slate-400 font-medium">({reviews.length})</span>
            </div>

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No client reviews yet. Reviews are posted upon completed contracts.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            rev.fromPhoto ||
                            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={rev.fromName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-800">{rev.fromName}</span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="text-xs font-bold ml-1 text-slate-800">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
